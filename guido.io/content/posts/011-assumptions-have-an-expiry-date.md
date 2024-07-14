---
title: "Assumptions have an expiry date in software"
date: 2023-06-15
slug: "assumptions-have-an-expiry-date"
description: ""
keywords: []
draft: false
tags: ["system-design", "saas"]
stylesheet: "post.css"
---

## Assumptions seem to never hold

Having a single e-mail per account may be fine for the first customers of your SaaS, but you will quickly learn that users want to invite their colleagues.

The assumption of `“one e-mail address <> one account”` is no longer good enough. The next step is to build a `teams` abstraction in your code, where one team consists of multiple users.

Should you have built this abstraction into your code from day one? [Some say you should](https://blog.bullettrain.co/teams-should-be-an-mvp-feature/). In case of e-mails, I would agree that it's a MVP feature. Some things are however better left for later as you may never end up launching your product otherwise.

## Trade off

There is a trade-off between keeping things simple versus flexible. The most important part of building a new product is to see if it solves a problem and can sustain a business. The goal is not to have the perfect future-proof codebase.

The question to ask is *"which assumptions can I get away with and for how long?"*.

## Exactly one relationships

Often modeling assumptions seem to be around ***exactly one*** relationships. `One e-mail <-> one paying customer` didn't hold for us. *Exactly one* relationships seem to be rather rare in the human and engineered world, but they can be a good-enough starting point.

Some example simplifying assumptions:

* A customer account
    * only needs a single login
    * has one address, in one country, and speaks one common language.
    * has one billing account
    * has only one internal team that uses your product
* A person
    * has one name
    * has one nationality
    * can be married to one person at a time
    * identifies as one gender
* Your server code
    * only needs to talk to one S3 bucket
    * only needs to run on one operating system
    * has one ground truth source for who is entitled to which features

## How to decide?

Some assumptions can be held longer than others. It’s a good idea to estimate when simplifying assumptions will bite you when designing your domain model.

Is it when you have 10 customers, 1000 customers, or do you expect that it will never be an issue? How much of a pain would it be to undo this assumption?

Depending on the answer you may want to spend some extra effort to reduce your future regret.