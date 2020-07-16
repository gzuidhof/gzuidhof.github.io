---
title: "Going fully serverless with Cloudflare Workers"
date: 2020-07-16
slug: "going-fully-serverless-with-cloudflare-workers"
description: "My experience going fully serverless with Cloudflare Workers"
keywords: []
draft: false
tags: ["cloudflare-workers", "serverless"]
stylesheet: "post.css"
---
Over the past two months I've built [FriendlyCaptcha](https://friendlycaptcha.com), a privacy friendly alternative to Google reCAPTCHA. Normally if I were to start a new web application, I would write the server code in Golang, spin up a Postgres instance, and host a dockerized version of it on Google Cloud Run to get many of the serverless benefits.

For a CAPTCHA product the requirements were a bit different: it is crtical that its API is fast, always available, has predictable costs, and can scale up and down instantly. A CAPTCHA service being down is a big issue for users, they can't verify the challenges submitted by their website visitors and face a dilemma: to allow requests without a valid challenge or to reject all requests (I propose they do the first!).

Serverless can be a good choice for minimizing the risk of downtime for your APIs, especially if you only have a small team. There are less moving parts, a datacenter outage doesn't mean your service is down, and also the individual workers are more isolated and short-lived reducing the chance of an error putting your server into an unrecoverable bad state.

## Cloudflare Workers
A couple years ago Cloudflare launched [Workers](https://workers.cloudflare.com/), a serverless platform that runs your code on *the edge*. That means your code runs in their datacenters all over the world, so any callee should have good latency from just about everywhere in the world.

Your code in a Cloudflare Worker runs in a V8 isolate which means that the overhead of cold starts is extremely small (less than 5ms), and response times in general are ridiculously fast because of this. This makes it great for server side rendering and APIs.

There is a catch, you have to make sure your server logic 'fits' within these limits:
* Less than 50ms of computation time for given request. Time that your script is waiting for a request does not count and not doing any computation.
* Your code needs to either be written in Javascript or be a WebAssembly binary. Your total code bundle can only be 1MB in total size.
* You can not use more than 128MB of memory.

If you can make it work you get a whole lot in return.

## Keeping state
Most applications or APIs have some state, even if it's only secrets used for authentication. You could of course talk to your relational database of choice, but that removes any latency advantages of running code on the edge and re-introduces a single point of failure(unless you have your own globally replicated relational database, which is possible, but as we're starting a new product here we don't have that just yet).

Instead we can keep state in a few different ways:

### Cache
Cloudflare Workers offers a cache that is at the level of a datacenter. This is useful for caching objects for minutes up to hours.

In FriendlyCaptcha this is how we can cache valid API keys without talking to the database every time.

### Workers KV
Workers KV is a key value store that is globally distributed and eventually consistent, built into Cloudflare Workers. It is designed for infrequent writing (up to once per second), but frequent reading. This is great if you want to cache data that your worker simply forwards (e.g. a file on S3). If you frequently read from a key its value will get cached in the local edge datacenter. 

In FriendlyCaptcha this is used to store user sessions when you log into the website.

### Serverless-friendly databases
Workers KV is not a great place to store data such as your user's data due to its eventual consistency and lack of powerful query support. Databases such as [FaunaDB](https://fauna.com/) and [Firestore](https://cloud.google.com/firestore) are a good fit for the serverless model, it's a fully managed service and you pay for usage and data storage instead of nodes and uptime.

In FriendlyCaptcha it is important that the solution of a solved CAPTCHA can not be re-used, by storing all completed puzzles in FaunaDB as well as in the Cloudflare Cache we can make sure that never happens.

## Website on the edge
By rendering the website on the edge you can achieve very quick response times and small bundle sizes, while still allowing you to use a templating engine and adapt the page to the user (e.g. for thei dashboard).

The [FriendlyCaptcha website](https://friendlycaptcha.com) is pure HTML and CSS that all gets rendered on the edge, there is no client-size Javascript. While I love frameworks like React, for a website (and many websites really) it's overkill. By rendering the website on the edge you get something that's in between a fully static website and a dynamic website.

For templating I use [lit-html-server](https://github.com/popeindustries/lit-html-server), and I'm happy with that choice. It's just Javascript and template literals that you can compose in a way that makes sense for you, there was no new framework to learn.

For a bigger real world example of a serverside rendering approach using CloudFlare workers is the [Discord website](https://discord.gg), it is so fast.

## What are the advantages of Cloudflare Workers?
* Your code runs close to the client in multiple datacenters, you don't have to manage any of that, and you can sleep at night knowing that a sudden hug of death probably won't take down your service.
* Predictable pricing, which at small to medium scale is often much lower than the classic load balancer + application servers setup.
* Less moving parts: a single script containing all API and website logic makes life easier. Having a development, staging and production environment is easy this way.
* If you are replacing a (SPA) you can start moving logic to the server, decreasing bundle size and the amount of endpoints you have to expose.
* The tooling is fairly good, there's a way to have environment variables and manage secrets, and you can preview your site/API locally.

## What are some disadvantages?
* In most serverless Javascript environments your code does not run in Node. Many libraries and client SDKs will only work in a Node environment.. I couldn't use the SDK for BigQuery, Sentry, Mailgun or Stripe, and instead had to use their REST APIs.
* There are limitations: only few languages are supported, 1MB max script size, 50ms runtime, 128MB of memory.
* There is some degree of lock-in. CloudFlare workers follow the Webworker spec, so it should be fairly easy to move to another provider, but if you use any goodies such as their KV distributed datastore changing that code to use something like Redis instead will require some effort.

## Should I go (fully) serverless?
Probably not, think about the application that you are building and whether any of these advantages matter. You can probably start off by writing the backend logic in your preferred language and running that on a machine on your favorite cloud provider. When that single machine no longer cuts it, you can introduce more machines.

Remember that if you are trying to build a product, whether something costs $5 or $10 per month probably won't make the difference between success and failure.

If your load is unpredictable, you require low latency, and you need reliability, then perhaps it may be the right choice. If you are building a tiny service, such as a Slack bot or a log-in wall in front of a static website, serverless is probably a great choice.

Finally, another good reason to use it is for fun or just to get acquainted with serverless. Limitations and constraints usually foster creative problem solving, which is perfect for hobby projects.
