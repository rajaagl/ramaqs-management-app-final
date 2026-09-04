import { Github, Chrome, Linkedin, Mail } from "lucide-react";

interface SocialButtonsProps {
  onGoogle?: () => void;
  onGithub?: () => void;
  onLinkedin?: () => void;
  onEmail?: () => void;
}

export function SocialButtons({ onGoogle, onGithub, onLinkedin, onEmail }: SocialButtonsProps) {
  const buttons = [
    { icon: Chrome, label: "Google", color: "hover:bg-red-50 hover:border-red-200", iconColor: "text-red-500", onClick: onGoogle },
    { icon: Github, label: "GitHub", color: "hover:bg-gray-50 hover:border-gray-300", iconColor: "text-gray-700", onClick: onGithub },
    { icon: Linkedin, label: "LinkedIn", color: "hover:bg-blue-50 hover:border-blue-200", iconColor: "text-blue-600", onClick: onLinkedin },
    { icon: Mail, label: "Email", color: "hover:bg-purple-50 hover:border-purple-200", iconColor: "text-purple-600", onClick: onEmail },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium transition-all duration-200 ${btn.color} hover:shadow-md`}
        >
          <btn.icon className={`h-4 w-4 ${btn.iconColor}`} />
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}