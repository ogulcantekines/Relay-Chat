// Check the exact Origin for mutations and WebSocket handshakes.
// SameSite cookies alone do not isolate sibling subdomains.
export function isAllowedOrigin(origin, request) {
    if (!origin) return true; // CLI clients need not provide a browser Origin.
    try {
        const parsed = new URL(origin);
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) return false;
        if (process.env.CLIENT_URL && parsed.origin === new URL(process.env.CLIENT_URL).origin) return true;
        if (process.env.NODE_ENV !== "production" && parsed.origin === "http://localhost:3000") return true;
        const protocol = process.env.COOKIE_SECURE === "true" || request.socket.encrypted ? "https:" : "http:";
        return parsed.host === request.headers.host && parsed.protocol === protocol;
    } catch { return false; }
}
export function protectOrigin(req, res, next) {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !isAllowedOrigin(req.headers.origin, req)) return res.status(403).json({ message: "Origin is not allowed" });
    next();
}
