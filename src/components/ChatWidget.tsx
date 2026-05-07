import React, { useState, useEffect, useRef } from "react";
import { Send, User, X, Minimize2, Maximize2, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ChatMessage, sendChatMessage } from "@/services/geminiService";
import { sendOfflineChatMessage } from "@/services/apiService";
import { UserProfile } from "@/types";

interface ChatWidgetProps {
  userProfile?: UserProfile;
  backendConnected?: boolean;
}

export default function ChatWidget({ userProfile, backendConnected }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: "model",
      parts: [{ text: "Hello! I'm Hofi, your personal digital nurse here at iCare+. 🌿 I'm here to help you feel better and find the right care in Tagbilaran. What can I do for you today?" }],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const [isOffline, setIsOffline] = useState(false);

  const handleOfflineTriage = async (input: string) => {
    const userMsg: ChatMessage = { role: "user", parts: [{ text: input }] };
    setHistory((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Try backend offline triage first (uses real Excel data)
    if (backendConnected) {
      try {
        const result = await sendOfflineChatMessage(input);
        if (result) {
          let reply = result.reply;
          if (result.found && result.hospitals?.length > 0) {
            const hospitalNames = result.hospitals
              .slice(0, 3)
              .map((h) => `• ${h.name}`)
              .join("\n");
            reply += `\n\nRecommended facilities:\n${hospitalNames}`;
            if (result.specialty) {
              reply += `\n\nSpecialty needed: ${result.specialty}`;
            }
          }
          setHistory((prev) => [...prev, { role: "model", parts: [{ text: reply }] }]);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fall through to hardcoded fallback
      }
    }

    // Hardcoded fallback (original behavior)
    let reply = "I understand. These are the suited hospitals for that section in Tagbilaran, Bohol. Please proceed to the ER if this is an emergency.";
    
    const text = input.toLowerCase();
    if (text.includes("chest pain")) {
      reply = "ESI-1: Chest pain needs immediate attention. Please proceed to GCGMC or Holy Name ER. These are the suited hospitals for that section.";
    } else if (text.includes("fever")) {
      reply = "ESI-4: For fever, you may visit Tagbilaran Community Hospital or any general clinic. These are the suited hospitals for that section.";
    } else if (text.includes("breath") || text.includes("shortness")) {
      reply = "ESI-1: Difficulty breathing is a red flag. Go to GCGMC or Ramiro ER immediately. These are the suited hospitals for that section.";
    } else if (text.includes("headache")) {
      reply = "ESI-5: For minor headaches, rest and hydration are recommended. If it worsens, see a GP. These are the suited hospitals for that section.";
    }
    
    setTimeout(() => {
      setHistory((prev) => [...prev, { role: "model", parts: [{ text: reply }] }]);
      setIsLoading(false);
    }, 600);
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    if (isOffline) {
      handleOfflineTriage(message);
      setMessage("");
      return;
    }

    const userMsg: ChatMessage = { role: "user", parts: [{ text: message }] };
    setHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const data = await sendChatMessage(message, history, userProfile);
      const botMsg: ChatMessage = { role: "model", parts: [{ text: data.text }] };
      setHistory((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errMsg: ChatMessage = {
        role: "model",
        parts: [{ text: "I'm sorry, I'm having trouble connecting to the medical network right now. Please try again in a moment." }],
      };
      setHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto mb-4 flex h-[600px] w-96 flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/70 shadow-2xl backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="flex bg-[#1f4f45] p-5 items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-medium leading-tight">iCare+ Nurse</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-green-100">Ready to help</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOffline(!isOffline)}
                  className={cn(
                    "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border transition-all",
                    isOffline 
                      ? "bg-amber-100 text-amber-700 border-amber-200" 
                      : "bg-white/10 text-white/60 border-white/10 hover:text-white hover:bg-white/20"
                  )}
                >
                  <AlertCircle className="h-2.5 w-2.5" />
                  {isOffline ? "Offline" : "Online"}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {isOffline && history.length === 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Chest pain", "Fever", "Cough", "Headache", "Abdominal pain"].map(sym => (
                    <button
                      key={sym}
                      onClick={() => handleOfflineTriage(sym)}
                      className="text-[10px] bg-[#8fd1bd]/20 text-[#1f4f45] px-3 py-1.5 rounded-full border border-[#8fd1bd]/40 hover:bg-[#8fd1bd]/40 transition-all font-medium"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              )}
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-line",
                      msg.role === "user"
                        ? "bg-[#1f4f45] text-white rounded-br-none"
                        : "bg-white text-[#1a3d35] border border-[#8fd1bd]/30 rounded-bl-none"
                    )}
                  >
                    {msg.parts[0].text}
                  </div>
                  <span className="mt-1 text-[10px] text-[#4a7a6e]/60 font-mono">
                    {msg.role === "user" ? "You" : "Nurse Hofi"}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start max-w-[85%]">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-[#8fd1bd]/30 shadow-sm">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#8fd1bd] animate-bounce" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#8fd1bd] animate-bounce [animation-delay:0.2s]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#8fd1bd] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/50 border-t border-white/20">
              <div className="relative flex items-center">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe your symptoms or concern..."
                  className="w-full resize-none rounded-2xl border-none bg-white py-3 pl-4 pr-12 text-sm text-[#1a3d35] placeholder-[#8ab5ae] ring-1 ring-[#8fd1bd]/20 focus:ring-2 focus:ring-[#1f4f45] focus:outline-none transition-all"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !message.trim()}
                  className="absolute right-2 rounded-xl bg-[#1f4f45] p-2 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-[#4a7a6e]/50 font-sans italic">
                Nurse Hofi provides health guidance, not medical diagnosis.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Bubble */}
      <button
        onClick={() => {
          if (isOpen && isMinimized) setIsMinimized(false);
          else if (!isOpen) setIsOpen(true);
        }}
        className={cn(
          "pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1f4f45] text-white shadow-xl transition-all hover:scale-110 active:scale-95",
          isOpen && !isMinimized && "hidden"
        )}
      >
        <MessageSquare className="h-8 w-8" />
        {(isOpen && isMinimized) || !isOpen ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#8fd1bd] text-[#1f4f45] text-[10px] font-bold"
          >
            !
          </motion.div>
        ) : null}
      </button>
    </div>
  );
}
