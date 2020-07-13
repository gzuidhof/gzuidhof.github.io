---
title: "Implementing a type-safe Stripe client for serverless using Typescript"
date: 2020-07-13
slug: "using-stripe-in-serverless-typescript"
description: "How to use the Stripe API without Node.JS in a type safe way"
keywords: []
draft: false
tags: ["cloudflare-worker", "serverless", "stripe"]
stylesheet: "post.css"
---
In my current project I am trying to go full origin-less: everything runs in a CloudFlare worker script, there is no centralized server. These serverless Javascript environments often don't run on Node, so there are a lot of libraries you can't use.

This makes going fully serverless painful, so far I had to implement the client code for [Mailgun](/posts/sending-email-from-cloudflare-workers), BigQuery and Stripe myself. Each of these has a great SDK for Node, but unfortunately we can't use those. This is a big downside of going fully serverless: you end up implementing these clients or finding workarounds instead of building your own application.

Fortunately, it turns out that for Stripe it's easy to write a type-safe client without too much code. **This is where Typescript really shines.**

## Setup

First we install the Stripe Node client, we will only use its typings so we can install it as a dev dependency.
```
npm install --save-dev stripe
```
Also we'll be using the `qs` NPM package, we use it to turn arbitrarily nested JSON objects into query strings.
```
npm install --save qs
```

## Writing our own client

Below is all there is to the client. It currently only implements a single operation (for creating customers), but it's trivial to add more.


```typescript
import { Stripe } from "stripe";
import { stringify } from "qs";

const STRIPE_SECRET_KEY = "please-dont-actually-hardcode-your-api-secret-here-but-store-it-more-safely";
const STRIPE_API_URL = "https://api.stripe.com";


export async function createCustomer(body: Stripe.CustomerCreateParams) {
    return fetchStripe("/v1/customers", body, {
        method: "POST",
    });
}

async function fetchStripe(endpoint: string, body?: any, init: RequestInit = {}): Stripe.Customer {
    init = {
        ...init,
        body: body ? stringify(body) : undefined,
        headers: {
            ...init.headers,
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${STRIPE_SECRET_KEY}`
        },
        
    }
    const url = STRIPE_API_URL + endpoint;
    const response = await fetch(url, init);

    // Note this line will throw in case we can't reach Stripe, error handling could be improved!
    const j = await response.json();

    if (!response.ok || response.status.toString()[0] !== "2") {
        throw new Error(`Stripe API call failed to ${endpoint} (${response.status}): ${JSON.stringify(j)}`);
    }
    return j;
}
```

### Using it

Now we can call the above code like this to create a new customer:

```typescript
const customer = await createCustomer({name: "Jane Doe", email: "jane@example/com"});
console.log(`Customer created with id ${customer.id}`);
```

The nice thing is that as we are using Typescript this will actually be typechecked as we are using the typings from the official Stripe NPM package. What that means is that your code-editor can autocomplete the fields, and if you add fields that are invalid the Typescript compiler will tell you.
