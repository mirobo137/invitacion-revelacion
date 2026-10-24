import { createRoot } from "react-dom/client";
import Home from "./app/page";
import "./app/globals.css";

declare global {
  interface Window {
    __INVITATION_LOCAL_VOTES__?: boolean;
  }
}

window.__INVITATION_LOCAL_VOTES__ = true;

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("No se encontró el contenedor de la invitación.");

createRoot(rootElement).render(<Home />);
