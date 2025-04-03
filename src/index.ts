"use strict";

export interface Env {
    PUSHOVER_USER: string;
    PUSHOVER_TOKEN: string;
}

import querystring from "querystring";

function escapeHTML(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function getImageBlob(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.blob();
}

function notFound(_request: Request, _env: Env) {
    return new Response(`Not found`, {
        status: 404,
    });
}

function unsupportedMethod(_request: Request, _env: Env) {
    return new Response(`Unsupported method`, {
        status: 400,
    });
}

async function doChinchin(request: Request, env: Env): Promise<Response> {
    const mention: { [name: string]: any } = await request.json();
    let res = await fetch(
        `https://nostr-nullpoga.compile-error.net/profile/${mention.pubkey}`,
    );
    let user: { [name: string]: any } = await res.json();

    const url = 'https://api.pushover.net/1/messages.json';
    const picture = await getImageBlob(user.picture);
    const formData = new FormData();
    formData.append('token', env.PUSHOVER_TOKEN);
    formData.append('user', env.PUSHOVER_USER);
    formData.append('message', mention.content);
    formData.append('title', user.name);
    //formData.append('html', '1');
    formData.append('attachment', picture, 'icon.jpg');
    formData.append('priority', '-1');

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        console.log('result:', result);
    } catch (error) {
        console.error('error:', error);
    }

    return new Response("");
}

export default {
    async fetch(
        request: Request,
        env: Env,
    ): Promise<Response> {
        const { protocol, pathname } = new URL(request.url);

        if (
            "https:" !== protocol ||
            "https" !== request.headers.get("x-forwarded-proto")
        ) {
            throw new Error("Please use a HTTPS connection.");
        }

        console.log(`${request.method}: ${request.url}`);

        if (request.method === "POST") {
            switch (pathname) {
                case "/chinchin":
                    return doChinchin(request, env);
            }
            return notFound(request, env);
        }

        return unsupportedMethod(request, env);
    },
};
