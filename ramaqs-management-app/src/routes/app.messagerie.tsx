import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { 
  MessageSquare, Send, Paperclip, Search, 
  Users, Clock, CheckCheck, Star, Archive,
  Trash2, MoreVertical, Phone, Video, 
  Smile, Mic, Image, File, Plus, X,
  Circle, CircleCheck, CircleDot, 
  Pin, PinOff, Reply, Forward
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useGetConversationsQuery, useGetMessagesByConversationQuery, useSendMessageMutation } from "../store/api/api";
import type { Conversation, Message } from "../store/interfaces";
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";

export const Route = createFileRoute("/app/messagerie")({
  component: () => (
            <ProtectedRoute allowedRoles={['direction', 'super_admin','chef_projet','partenaire','consultant','client']}>
              <MessageriePage />
            </ProtectedRoute>
          ),
});

interface Contact {
  id: string;
  nom: string;
  avatar: string;
  role: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
  unread?: number;
}

function MessageriePage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const { data: conversationsData, isLoading: convLoading } = useGetConversationsQuery({ page: 1 });
  const { data: messagesData, isLoading: msgLoading } = useGetMessagesByConversationQuery(
    { conversationId: selectedConversationId || "", page: 1 },
    { skip: !selectedConversationId }
  );
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Données mock pour les contacts (à remplacer par vos données API)
  const contacts: Contact[] = [
    { id: "1", nom: "Salma Bennani", avatar: "SB", role: "Directrice projets", status: "online" },
    { id: "2", nom: "Yassine Alaoui", avatar: "YA", role: "Chef de projet senior", status: "online" },
    { id: "3", nom: "Mehdi El Amrani", avatar: "ME", role: "Architecte solution", status: "away", lastSeen: "Il y a 10 min" },
    { id: "4", nom: "Rania Tazi", avatar: "RT", role: "Data scientist", status: "offline", lastSeen: "Hier" },
    { id: "5", nom: "Nora Benali", avatar: "NB", role: "Consultante cybersécu", status: "online" },
    { id: "6", nom: "Karim Hadi", avatar: "KH", role: "Lead développeur", status: "offline", lastSeen: "Il y a 2h" },
  ];

  const filteredContacts = contacts.filter(c => 
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Messages mock (à remplacer par vos données API)
  const messages = [
    { id: "1", text: "Bonjour, comment se passe le projet RMQ-2025-001 ?", isUser: false, time: "10:30", status: "read" },
    { id: "2", text: "Le projet avance bien, nous avons terminé la phase de spécification.", isUser: true, time: "10:32", status: "read" },
    { id: "3", text: "Excellent ! Pouvez-vous me partager le planning de la phase suivante ?", isUser: false, time: "10:33", status: "read" },
    { id: "4", text: "Bien sûr, je vous envoie ça dans la journée.", isUser: true, time: "10:35", status: "sent" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId) return;
    
    try {
      await sendMessage({ 
        conversationId: selectedConversationId, 
        contenu: messageInput 
      }).unwrap();
      setMessageInput("");
      scrollToBottom();
    } catch (error) {
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Circle className="h-2.5 w-2.5 text-success fill-success" />;
      case "away":
        return <CircleDot className="h-2.5 w-2.5 text-warning" />;
      default:
        return <Circle className="h-2.5 w-2.5 text-muted-foreground" />;
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3.5 w-3.5 text-info" />;
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-success" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const selectedContact = contacts.find(c => c.id === selectedConversationId);

  return (
    <AppShell
      title="Messagerie"
      subtitle="Communication en temps réel avec vos équipes"
      actions={
        <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-sm">
          <Plus className="h-4 w-4" /> Nouvelle conversation
        </button>
      }
    >
      <div className="h-[calc(100vh-200px)] flex overflow-hidden rounded-xl border border-border bg-card">
        
        {/* Sidebar - Liste des conversations */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* En-tête sidebar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filtres rapides */}
          <div className="flex gap-1 p-3 border-b border-border">
            {["Tous", "Non lus", "Groupes", "Archives"].map((filter) => (
              <button
                key={filter}
                className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-muted transition"
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedConversationId(contact.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition hover:bg-muted/50 ${
                  selectedConversationId === contact.id ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {contact.avatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {getStatusIcon(contact.status)}
                  </div>
                </div>

                {/* Infos contact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{contact.nom}</p>
                    <span className="text-[10px] text-muted-foreground">10:30</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                  {contact.unread && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium mt-1">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de chat principal */}
        {selectedConversationId ? (
          <div className="flex-1 flex flex-col">
            {/* En-tête du chat */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {selectedContact?.avatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {selectedContact && getStatusIcon(selectedContact.status)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedContact?.nom}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedContact?.status === "online" ? "En ligne" : 
                     selectedContact?.status === "away" ? "Absent" : 
                     `Dernière connexion ${selectedContact?.lastSeen}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-muted transition">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition">
                  <Video className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {!msg.isUser && (
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-xs mr-2 flex-shrink-0">
                      {selectedContact?.avatar}
                    </div>
                  )}
                  <div className={`max-w-[70%] group ${msg.isUser ? "items-end" : "items-start"}`}>
                    <div className={`rounded-lg p-3 ${
                      msg.isUser 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-foreground"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                      {msg.isUser && getMessageStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-border bg-card/50">
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-muted transition">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition">
                  <Image className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition">
                  <Smile className="h-5 w-5 text-muted-foreground" />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              
              {/* Suggestions de réponses rapides */}
              <div className="flex gap-2 mt-3">
                {["OK", "Je regarde", "Merci", "À plus tard"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMessageInput(suggestion)}
                    className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* État vide - aucune conversation sélectionnée */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune conversation sélectionnée</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choisissez une conversation dans la liste de gauche pour commencer à échanger.
            </p>
            <button className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Nouvelle conversation
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
