"use client"
import { useEffect, useRef } from "react"
import { Client } from "@stomp/stompjs"

export type NotifPayload = {
  type: "IA_ALERTE" | "RAPPORT_VALIDE" | "INCIDENT_HSE" | string
  data: Record<string, unknown>
}

export function useNotifications(onNotif?: (n: NotifPayload) => void) {
  const onNotifRef = useRef(onNotif)
  onNotifRef.current = onNotif

  useEffect(() => {
    let client: Client | null = null

    fetch("/api/auth/me")
      .then(r => (r.ok ? r.json() : null))
      .then(user => {
        const companyId: string | undefined = user?.company?.id
        if (!companyId) return

        const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws"
        // Spring SockJS exposes a plain-WebSocket handshake endpoint at /websocket suffix
        const brokerURL = wsBase.endsWith("/websocket") ? wsBase : `${wsBase}/websocket`

        client = new Client({
          brokerURL,
          reconnectDelay: 5_000,
          onConnect: () => {
            client?.subscribe(`/topic/org/${companyId}/notifications`, frame => {
              try {
                const notif = JSON.parse(frame.body) as NotifPayload

                // Dispatch UI event (toast overlay)
                window.dispatchEvent(
                  new CustomEvent("engipilot:notification", { detail: notif })
                )
                onNotifRef.current?.(notif)

                // Persist to DB so the notifications page shows it
                const data = notif.data
                const type =
                  notif.type === "IA_ALERTE"     ? "AI_ALERT" :
                  notif.type === "INCIDENT_HSE"  ? "ERROR"    :
                  notif.type === "RAPPORT_VALIDE"? "SUCCESS"  : "INFO"

                fetch("/api/notifications", {
                  method:  "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title:   (data.titre       as string | undefined) ?? notif.type,
                    message: (data.description as string | undefined) ?? JSON.stringify(data),
                    type,
                  }),
                }).catch(() => { /* best-effort */ })
              } catch {
                // ignore malformed frames
              }
            })
          },
          onStompError: frame => {
            console.warn("[STOMP] error", frame.headers["message"])
          },
        })

        client.activate()
      })
      .catch(() => {
        // not authenticated — skip WS connection
      })

    return () => {
      client?.deactivate()
    }
  }, []) // single activation — callback handled via ref
}
