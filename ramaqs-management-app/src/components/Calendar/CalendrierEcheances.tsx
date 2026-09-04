// src/components/Calendar/CalendrierEcheances.tsx

import { useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type EventDropArg } from "@fullcalendar/interaction";
import api from "@/lib/api";
import { AppShell } from "@/components/AppShell";

interface CalendarEvent {
  id: string;
  type: "tache" | "projet";
  titre: string;
  debut: string;
  fin: string;
  statut: string;
  projet: string;
  assigneA: string | null;
  couleur: string;
  peutModifier: boolean;
}

export default function CalendrierEcheances() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    const { data } = await api.get<CalendarEvent[]>("/calendar/events/", {
      params: { start: start.slice(0, 10), end: end.slice(0, 10) },
    });
    setEvents(data);
  }, []);

  const handleEventDrop = async (info: EventDropArg) => {
    try {
      await api.patch(`/calendar/events/${info.event.id}/`, {
        debut: info.event.startStr,
        fin: info.event.endStr || info.event.startStr,
      });
    } catch {
      info.revert();
      alert("Vous n'avez pas la permission de modifier cette échéance.");
    }
  };

  return (
    <AppShell
      title="Calendrier"
      subtitle="Échéances & tâches"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        {/* Légende */}
        <div className="flex flex-wrap gap-4 mb-5 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />En cours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500" />Terminé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />En retard
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500" />Échéance projet
          </span>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="fr"
          height="auto"
          events={events.map((e) => ({
            id: e.id,
            title: e.titre,
            start: e.debut,
            end: e.fin,
            color: e.couleur,
            editable: e.peutModifier,
            extendedProps: {
              projet: e.projet,
              assigneA: e.assigneA,
              type: e.type,
            },
          }))}
          editable
          eventDrop={handleEventDrop}
          datesSet={(arg) => fetchEvents(arg.startStr, arg.endStr)}
          eventClick={(info) => {
            const { projet, assigneA } = info.event.extendedProps as {
              projet: string;
              assigneA: string | null;
            };
            alert(
              `${info.event.title}\nProjet : ${projet}${assigneA ? `\nAssigné à : ${assigneA}` : ""}`
            );
          }}
        />
      </div>
    </AppShell>
  );
}