---
title: "Controlling variance in proof-of-work algorithms"
date: 2020-07-17
slug: "controlling-variance-in-proof-of-work-algorithms"
description: "How to solve the progress and variance problem in proof of work algorithms."
keywords: []
draft: true
tags: ["proof-of-work"]
stylesheet: "post.css"
---
Proof of work (PoW) algorithms generally have no notion of progress, instead they are more like playing the lottery millions of times until you win. Losing a million times doesn't influence your chances of winning the next one.

That's ok and probably even desirable for applications like a cryptocurrency mining, but undesirable for an application like hashcash in which the proof of work is used as a *payment* for say, signing up for a website. I created an [open source](https://github.com/gzuidhof/friendly-pow), more user friendly captcha based on proof of work. It is important that this captcha takes roughly the same amount of computation for any given user to complete, and even more important that there are no outliers.

In the lottery example there are no guarantees, one user might win on the first attempt, and another may need many attempts. Before we dive into specifics and the simple solution, let's explore the properties of a good proof of work problem.

## Our proof-of-work setup
The idea behind PoW is that the puzzle (also called challenge) must be cheap to verify, but expensive to compute.

A PoW that would be "hash this string 1 million times" would be expensive to compute, but just as expensive to verify. Instead most PoW algorithms make the user search for a needle in a haystack: we generate a *puzzle string* `p`, and ask the user to find a *nonce* `q` such that the hash of `p` and `q` concatenated meets some rare criteria. If we use a good hash function, any input string is just as likely to meet this criteria as another.

Remember that any bytes or string can be interpreted as a number. We take the first 4 bytes of the hash and interpret them as a 32 bit integer. If that number is below some threshold T (which you could call the inverse of the difficulty) then it is a valid solution. Any hash input is just as likely as the next to meet that criteria, so to find the solution the user would just try different values for the nonce `q` until they find a winning solution. Not so different from playing the lottery a lot!

## How many tries does it take?
If your chances of winning the lotery are one in a million, after a million tries your odds of winning at least once is around 63.2% (`1 - 0.999999^1000000`). The problem is that some users may be really unlucky and instead need 3 million attemps (around 5% of people in fact), or even more! In other words: there is a large amount of variance in how many attempts are needed. This can be problematic for a CAPTCHA proof of work: the user will give up on waiting if it takes 5 times longer than expected. They don't care what the mathematical average is, they just want to sign up for your website.

For a decent user experience the user also deserves some sort of progress indicator. Just showing *"solving the captcha"* for 10 seconds without any indication of will make the user give up and think the website is broken. If instead we show a progress bar increases by 10% every second it's much more tolerable. 

The problem is: there is no progress, nobody knows when they will find the nonce that creates a hash that satisfies the criteria. Fortunately, there is a straightforward solution to both the progress and variance issue: we ask users to find more than one nonce.

## Multiple, easier problems
Instead of making the user find the 1 in a million nonce, we make them find 10 nonces to a 1 in 100k problem. The expected number of attempts is still the same , but now we can show a progress bar to the user! Not only do we solve the progress problem, we also decrease the variance of how many attempts were required in total. As we increase the number of nonces we ask, the variance decreases:

