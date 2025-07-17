export function seo({ description, image, keywords, title }: { description?: string; image?: string; keywords?: string; title: string }) {
    const tags = [
        { title },
        { content: description, name: "description" },
        { content: keywords, name: "keywords" },
        { content: "Noah Trần", name: "author" },
        { content: title, name: "twitter:title" },
        { content: description, name: "twitter:description" },
        { content: "@not_sh1ro", name: "twitter:creator" },
        { content: "@not_sh1ro", name: "twitter:site" },
        { content: "website", name: "og:type" },
        { content: title, name: "og:site_name" },
        { content: title, name: "og:title" },
        { content: description, name: "og:description" },
        { content: "https://carbon-daily.vercel.app", name: "og:url" },
        { content: "vi_VN", name: "og:locale" },
        ...image
            ? [
                { content: image, name: "twitter:image" },
                { content: "summary_large_image", name: "twitter:card" },
                { content: image, name: "og:image" },
            ]
            : [],
    ];

    return tags;
}
