export function pageHead(title, description) {
    const t = `${title} — Shivaji University Book Bank`;
    return () => ({
        meta: [
            { title: t },
            { name: "description", content: description },
            { property: "og:title", content: t },
            { property: "og:description", content: description },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary" },
        ],
    });
}
