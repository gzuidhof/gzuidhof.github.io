---
title: "Sending e-mail from Cloudflare Workers"
date: 2020-06-24
slug: "sending-email-from-cloudflare-workers"
description: "How to send e-mail from a Cloudflare Worker script using Mailgun"
keywords: []
draft: false
tags: ["cloudflare-workers", "serverless"]
stylesheet: "post.css"
---
In most serverless environments, [Cloudflare Workers](https://workers.cloudflare.com/) included, you can not send e-mail through SMTP. Also, many client SDKs for providers such as Mailgun or Sendgrid assume you are on the Node platform and will not work in many serverless runtimes. Luckily most providers also provide a REST API to send e-mail.

I ended up going with Mailgun, below is some example Typescript code that works in Cloudflare Workers.

```typescript
declare const MAILGUN_API_BASE_URL: string;
declare const MAILGUN_API_KEY: string;

export interface EmailData {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string
    cc?: string;
    bcc?: string;
    "h-Reply-To"?: string;
    "o:testmode"?: boolean;
}


function urlEncodeObject(obj: {[s: string]: any}) {
  return Object.keys(obj)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
    .join("&");
}


export function sendMail(data: EmailData) {
    const dataUrlEncoded = urlEncodeObject(data);
    const opts = {
        method: "POST",
        headers: {
            Authorization: "Basic " + btoa("api:" + MAILGUN_API_KEY),
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": dataUrlEncoded.length.toString()
        },
        body: dataUrlEncoded,
    }

    return fetch(`${MAILGUN_API_BASE_URL}/messages`, opts);
}
```

You will have to set the global environment variables `MAILGUN_API_BASE_URL` and `MAILGUN_API_KEY` for your worker script using wrangler. The API base url can be put in the environment variables, `MAILGUN_API_KEY` should be added as a secret which you can do using the wrangler cli:

```
wrangler secret put MAILGUN_API_KEY
```

It will prompt you for the secret value afterwards. 
