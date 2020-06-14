---
title: "Embedding WebAssembly in Javascript code"
date: 2020-06-14
slug: "embedding-webassembly-in-javascript"
description: "How to embed WebAssembly wasm source as base64 in Javascript."
keywords: []
draft: false
tags: ["assemblyscript", "webassembly"]
stylesheet: "post.css"
---

Actually shipping compiled [WebAssembly](https://webassembly.org/) code can be tricky. Especially when you want the wasm module to be easy to install and use through NPM it gets complicated, users will have to use wasm  plugins for their bundler of choice (such as Webpack or Rollup), or they will need to host the wasm file separately and pass it into your library.

If the developer of this project does not interact with WASM code otherwise, this may be a big ask.

## Embedding WASM source code as base64 string

Instead of having a separate file for the wasm that we load asynchronously, one can embed the WASM source code as a string in Javascript code. While this does come at a larger binary size (~33% for base64), it simplifies things a lot (and saves a request). With this technique you can distribute JS files only, so that the user of your libary does not need a special build step.


## Rollup plugin for embedding base64 strings

I created a small plugin for Rollup that allows you to easily embed any file as a base64 encoded string in Javascript, it's called `rollup-plugin-base64`. Check it out [here](https://github.com/gzuidhof/rollup-plugin-base64).

This allows you to load a `.wasm` file like this:

```javascript
// input.js

import base64Wasm from "./my-wasm-library.wasm";

function base64Decode(str) {
    try { // Browser
        return atob(str);
    } catch(err) { // Node
        return Buffer.from(str, "base64");
    }
};

export async function loadMyWasmLibrary() {
  const wasmBytes = base64Decode(base64Wasm);
  const module = await WebAssembly.instantiate(wasmBytes, {});
  // ...
}
```

Then we can run:
```
rollup  -p 'base64={include: "**/*.wasm"}' -i input.js -f es -o output.js
```
And that outputs a file 
```javascript
// output.js

var base64Wasm = "AGFzbQEAAAABBwFgAn9/AX8DAgEABwcBA2FkZAAACgkBBwAgACABags=";
function base64Decode(str) {
    try { // Browser
        return atob(str);
    } catch(err) { // Node
        return Buffer.from(str, "base64");
    }
}
async function loadMyWasmLibrary() {
  const wasmBytes = base64Decode(base64Wasm);
  const module = await WebAssembly.instantiate(wasmBytes, {});
  // ...
}

export { loadMyWasmLibrary };
```

> For any serious project you should use Rollup with a config file instead, [this minimal example](https://github.com/gzuidhof/rollup-plugin-base64/tree/master/examples/add) should be a good starting point.
