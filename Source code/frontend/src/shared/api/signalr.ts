"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { getApiBase, OrderTicketDto, TableNotificationDto } from "./client";

// Global audio chime helper (synthesizes chime without needing external mp3 asset)
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Pleasant double chime: 587.33Hz (D5) -> 880Hz (A5)
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch {
    // Ignore audio context autoplay limitations
  }
}

export type SignalREvents = {
  onOrderPendingConfirm?: (ticket: OrderTicketDto) => void;
  onOrderConfirmed?: (data: any) => void;
  onOrderRejected?: (data: { ticketId: string; reason?: string }) => void;
  onOrderCreated?: (ticket: OrderTicketDto) => void;
  onKitchenUpdated?: (data: any) => void;
  onStaffCalled?: (notification: TableNotificationDto) => void;
  onBillRequested?: (notification: TableNotificationDto) => void;
  onNotificationDismissed?: (notificationId: string) => void;
  onSessionClosed?: (sessionId: string) => void;
};

let sharedConnection: signalR.HubConnection | null = null;
let connectionPromise: Promise<void> | null = null;

export function getOrderHubConnection(): signalR.HubConnection {
  if (!sharedConnection) {
    const hubUrl = `${getApiBase()}/hubs/order`;
    sharedConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          if (typeof window !== "undefined") {
            const token = localStorage.getItem("orderpum_token");
            if (token && token.trim().length > 0) return token.trim();
          }
          return "";
        },
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return sharedConnection;
}

export function useOrderSignalR(events: SignalREvents = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const connection = getOrderHubConnection();

    // Register event listeners
    const handlePendingConfirm = (ticket: OrderTicketDto) => {
      playNotificationSound();
      eventsRef.current.onOrderPendingConfirm?.(ticket);
    };

    const handleConfirmed = (data: any) => {
      playNotificationSound();
      eventsRef.current.onOrderConfirmed?.(data);
    };

    const handleRejected = (data: { ticketId: string; reason?: string }) => {
      eventsRef.current.onOrderRejected?.(data);
    };

    const handleCreated = (ticket: OrderTicketDto) => {
      eventsRef.current.onOrderCreated?.(ticket);
    };

    const handleKitchenUpdated = (data: any) => {
      eventsRef.current.onKitchenUpdated?.(data);
    };

    const handleStaffCalled = (notification: TableNotificationDto) => {
      playNotificationSound();
      eventsRef.current.onStaffCalled?.(notification);
    };

    const handleBillRequested = (notification: TableNotificationDto) => {
      playNotificationSound();
      eventsRef.current.onBillRequested?.(notification);
    };

    const handleDismissed = (notificationId: string) => {
      eventsRef.current.onNotificationDismissed?.(notificationId);
    };

    const handleSessionClosed = (sessionId: string) => {
      eventsRef.current.onSessionClosed?.(sessionId);
    };

    connection.on("order.pending_confirm", handlePendingConfirm);
    connection.on("order.confirmed", handleConfirmed);
    connection.on("order.rejected", handleRejected);
    connection.on("order.created", handleCreated);
    connection.on("kitchen.updated", handleKitchenUpdated);
    connection.on("staff.called", handleStaffCalled);
    connection.on("bill.requested", handleBillRequested);
    connection.on("notification.dismissed", handleDismissed);
    connection.on("session.closed", handleSessionClosed);

    const start = async () => {
      if (connection.state === signalR.HubConnectionState.Disconnected) {
        try {
          if (!connectionPromise) {
            connectionPromise = connection.start();
          }
          await connectionPromise;
          setIsConnected(true);
        } catch (err) {
          console.warn("SignalR connection error (will retry automatically):", err);
          setIsConnected(false);
        } finally {
          connectionPromise = null;
        }
      } else if (connection.state === signalR.HubConnectionState.Connected) {
        setIsConnected(true);
      }
    };

    start();

    const onReconnecting = () => setIsConnected(false);
    const onReconnected = () => setIsConnected(true);
    const onClose = () => setIsConnected(false);

    connection.onreconnecting(onReconnecting);
    connection.onreconnected(onReconnected);
    connection.onclose(onClose);

    return () => {
      connection.off("order.pending_confirm", handlePendingConfirm);
      connection.off("order.confirmed", handleConfirmed);
      connection.off("order.rejected", handleRejected);
      connection.off("order.created", handleCreated);
      connection.off("kitchen.updated", handleKitchenUpdated);
      connection.off("staff.called", handleStaffCalled);
      connection.off("bill.requested", handleBillRequested);
      connection.off("notification.dismissed", handleDismissed);
      connection.off("session.closed", handleSessionClosed);
    };
  }, []);

  return { isConnected };
}
