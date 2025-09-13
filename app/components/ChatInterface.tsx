"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  MessageCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { getAuthToken } from "@/lib/cookies";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";

interface ChatMessage {
  id: string;
  message: string;
  sender: "user" | "ai";
  timestamp: string;
  goalId?: number;
}

interface ChatInterfaceProps {
  goalId?: number;
  className?: string;
}

export default function ChatInterface({
  goalId,
  className = "",
}: ChatInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiTyping]);

  // Initialize Socket.io connection
  useEffect(() => {
    const token = getAuthToken();
    console.log("ChatInterface: Token retrieved:", !!token);
    console.log(
      "ChatInterface: Token preview:",
      token ? `${token.substring(0, 30)}...` : "null"
    );

    if (!token) {
      setError("Authentication required. Please log in.");
      setIsLoading(false);
      return;
    }

    console.log("ChatInterface: Connecting to Socket.io with token");
    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
      }
    );

    setSocket(socketInstance);

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("Connected to chat server");
      setIsConnected(true);
      setError(null);
      setIsLoading(false);

      // Load chat history
      socketInstance.emit("get_chat_history", {
        goalId: goalId || null,
        limit: 50,
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from chat server");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setError("Failed to connect to chat server");
      setIsConnected(false);
      setIsLoading(false);
    });

    // Chat message handlers - only for user messages
    socketInstance.on("chat_message", (data: ChatMessage) => {
      // Only add user messages here, AI messages come through ai_message_chunk
      if (data.sender === "user") {
        setMessages((prev) => [...prev, data]);
      }
    });

    socketInstance.on(
      "chat_history",
      (data: { messages: ChatMessage[]; hasMore: boolean }) => {
        setMessages(data.messages);
      }
    );

    // AI response handlers
    socketInstance.on("ai_typing", (typing: boolean) => {
      setAiTyping(typing);
    });

    socketInstance.on(
      "ai_message_chunk",
      (data: { content: string; isComplete: boolean }) => {
        // Handle streaming AI responses
        if (!data.isComplete) {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (
              lastMessage &&
              lastMessage.sender === "ai" &&
              lastMessage.id === "streaming"
            ) {
              // Update streaming message
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  message: lastMessage.message + data.content,
                },
              ];
            } else {
              // Start new streaming message
              return [
                ...prev,
                {
                  id: "streaming",
                  message: data.content,
                  sender: "ai",
                  timestamp: new Date().toISOString(),
                  goalId,
                },
              ];
            }
          });
        } else {
          // Complete streaming message - finalize the streaming message
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.id === "streaming") {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  id: Date.now().toString(),
                  message: lastMessage.message + data.content,
                },
              ];
            }
            return prev;
          });
          setAiTyping(false);
        }
      }
    );

    // Error handler
    socketInstance.on("error", (error: { message: string }) => {
      setError(error.message);
    });

    // Typing indicators
    socketInstance.on(
      "user_typing",
      (data: { userId: string; isTyping: boolean }) => {
        // Handle other users typing (for future multi-user support)
        console.log('User typing:', data);
      }
    );

    return () => {
      socketInstance.disconnect();
    };
  }, [goalId]);

  // Handle sending messages
  const sendMessage = () => {
    if (!socket || !inputMessage.trim() || !isConnected) return;

    const messageData = {
      message: inputMessage.trim(),
      goalId: goalId || null,
    };

    socket.emit("chat_message", messageData);
    setInputMessage("");

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !isConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { isTyping: false });
    }, 1000);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className='flex items-center justify-center p-8'>
          <div className='flex items-center gap-2'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>Connecting to AI Tutor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <MessageCircle className='h-5 w-5' />
            AI Tutor Chat
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex-1 flex flex-col p-0 overflow-hidden'>
        {error && (
          <Alert variant='destructive' className='mx-4 mb-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <ScrollArea className='flex-1 px-4 h-full'>
          <div className='space-y-4 pb-4 min-h-full'>
            {messages.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                <Bot className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                <p>Start a conversation with your AI tutor!</p>
                <p className='text-sm mt-2'>
                  Ask questions about your learning goals or get help with any
                  topic.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "ai" && (
                    <Avatar className='h-8 w-8 mt-1'>
                      <AvatarFallback className='bg-blue-100 text-blue-600'>
                        <Bot className='h-4 w-4' />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className='whitespace-pre-wrap'>{message.message}</p>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        message.sender === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      <Clock className='h-3 w-3' />
                      <span>{formatTime(message.timestamp)}</span>
                    </div>
                  </div>

                  {message.sender === "user" && (
                    <Avatar className='h-8 w-8 mt-1'>
                      <AvatarFallback className='bg-green-100 text-green-600'>
                        <User className='h-4 w-4' />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {/* AI Typing Indicator */}
            {aiTyping && (
              <div className='flex gap-3 justify-start'>
                <Avatar className='h-8 w-8 mt-1'>
                  <AvatarFallback className='bg-blue-100 text-blue-600'>
                    <Bot className='h-4 w-4' />
                  </AvatarFallback>
                </Avatar>
                <div className='bg-gray-100 rounded-lg px-4 py-2'>
                  <div className='flex items-center gap-1'>
                    <div className='flex space-x-1'>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                      <div
                        className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className='text-sm text-gray-500 ml-2'>
                      AI is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className='border-t p-4'>
          <div className='flex gap-2'>
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected ? "Type your message..." : "Connecting..."
              }
              disabled={!isConnected || aiTyping}
              className='flex-1'
            />
            <Button
              onClick={sendMessage}
              disabled={!isConnected || !inputMessage.trim() || aiTyping}
              size='sm'
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>
          {isTyping && (
            <p className='text-xs text-gray-500 mt-1'>You are typing...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
