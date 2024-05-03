"use strict";

export interface Env {
  LINE_NOTIFY_TOKEN: string;
}

import querystring from "querystring";

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
  res = await fetch("https://notify-api.line.me/api/notify", {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Bearer " + env.LINE_NOTIFY_TOKEN,
    },
    body: querystring.stringify({
      imageFullsize: user.picture,
      imageThumbnail: user.picture,
      message: `${user.name}\n${mention.content}`,
    }),
  });
  console.log(await res.json());
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
