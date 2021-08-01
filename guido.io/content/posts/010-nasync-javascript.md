---
title: "What if Javascript had a synchronous async flavor?"
date: 2021-08-01
slug: "nasync-javascript"
description: "What if Javascript had a synchronous async flavor? Introducing n/async Javascript"
keywords: []
draft: false
tags: ["async", "javascript", "babel"]
stylesheet: "post.css"
---
When writing asynchronous javascript your code will contain a bunch of `await` and `async`, `Promise`s and maybe callbacks.

Here's an example where we fetch a page and count the amount of `div` elements:

{{< starboardwrap >}}
{{< starboardembed >}}
# %%--- [javascript]
# properties:
#   run_on_load: true
# ---%%
async function fetchPageBody(url) {
    const response = await fetch(url);
    return response.text();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}

const body = await fetchPageBody("https://enable-cors.org/");
const numDivs = (body.match(/<div/g) || []).length;

console.log("Number of divs:", numDivs);

await sleep(2000);
console.log("This prints after two seconds.");{{< /starboardembed >}}

As you write more and more code that is asynchronous, you will end up writing `await` quite a bit. In languages like Python and Go you write asynchronous code as if it's synchronous. What if we could do the same in Javascript? I'm tired of calling a function only to find out it returns a Promise instead of a real value.

## Introducing **n/async Javascript**
n/async Javascript takes the code you write, and puts `await` in front of every expression. That sounds crazy, and it is, but here's a demo:

{{< starboardembed >}}
---
starboard:
  plugins:
    - src: "https://cdn.jsdelivr.net/npm/nasync-js@0.1.0/dist/index.js"
---
# %%--- [nasync]
# properties:
#   run_on_load: true
# ---%%
function fetchPageBody(url) {
    return fetch(url).text();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}

const body = fetchPageBody("https://enable-cors.org/");
const numDivs = (body.match(/<div/g) || []).length;

console.log("Number of divs:", numDivs);

sleep(2000);
console.log("This prints after two seconds.");{{< /starboardembed >}}

Click the **`> Show transpiled code`** button below the code to see the transpiled version. As you can see a lot of (unnecessary) awaits got inserted, but at least we don't have to write them ourselves anymore surely increasing our productivity 10x.

The transpiler is powered by Babel and can be found [here](https://github.com/gzuidhof/nasync-js).

## Why is this a bad idea?
This flavor of Javascript allows us to write asynchronous code as if it is synchronous, but in reality of course it is still asynchronous. With this flavor of Javascript you can no longer do two asynchronous tasks at the same time, everything will be executed synchronously. For example if you want to make a request using `fetch`, but are only willing to wait for two seconds for the result, you're out of luck.

Secondly, compilers these days are really smart, but user code sprinkling in `await` everywhere (including places where it does nothing) likely was not a priority in optimization for the compiler designers.

## So what is it good for?
Use it for fun, use it in experimental code in a notebook (like the above examples), but please don't put this into production.


## Any caveats?
Member access expressions are not awaited (as `this` would lead to issues when calling a member function). For example:

```javascript
// n/async javascript input
const x = myObject.a.b.c();

// Transpiled output
(async () => {const x = await (await myObject).a.b.c();
})();

// What you may expect
(async () => {const x = await (await (await (await (await myObject).a).b).c)();
})();
```
In practice this likely what you want anyway. If you do need to await member variables you can just write await yourself. 

Do edit the code blocks above and play with it :)!