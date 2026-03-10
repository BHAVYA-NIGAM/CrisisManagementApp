import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../constants/config";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!token) {
      setEvents([]);
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token }
    });

    const push = (type) => (payload) => {
      setEvents((prev) => [{ type, payload, at: Date.now() }, ...prev].slice(0, 100));
    };

    socket.on("broadcast_created", push("broadcast_created"));
    socket.on("status_updated", push("status_updated"));
    socket.on("sos_created", push("sos_created"));
    socket.on("sos_updated", push("sos_updated"));
    socket.on("alert_level_updated", push("alert_level_updated"));
    socket.on("transport_request_created", push("transport_request_created"));
    socket.on("transport_request_updated", push("transport_request_updated"));
    socket.on("help_offered", push("help_offered"));
    socket.on("help_response", push("help_response"));
    socket.on("profile_updated", push("profile_updated"));

    return () => socket.disconnect();
  }, [token]);

  const value = useMemo(() => ({ events }), [events]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketEvents = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketEvents must be used within SocketProvider");
  return ctx;
};
