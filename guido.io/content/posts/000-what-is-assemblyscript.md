---
title: "What is AssemblyScript?"
date: 2020-06-10
slug: "what-is-assemblyscript"
description: "An introduction to AssemblyScript: a compiled subset of Typescript that targets WebAssembly."
keywords: []
draft: false
tags: ["assemblyscript"]
stylesheet: "post.css"
---

<p style="font-size: 1.2em; font-weight: bold">⚠️ I am still writing this article, consider this an unfinished first draft.</p>

[**AssemblyScript**](https://www.assemblyscript.org/) is a programming language that is almost the same as [**Typescript**](https://www.typescriptlang.org/) and compiles to [**WebAssembly**](https://webassembly.org/). 

WebAssembly allows near-native speed for programs that rely on heavy computation with smaller binaries. Any modern browser nowadays supports it as well as [**Deno**](https://deno.land/) and [**Node**](https://nodejs.org/en/). It will not replace Javascript itself anytime soon, but for some problems it can be a good choice, especially those that involve extensive computation.

In my opinion Assemblyscript is the easiest way to get started with WebAssembly today, especially if you are already familiar with Typescript.

## A realistic example

Instead of showing a game of life implementation, I want to show examples for a usecase that WebAssembly may actually be the right choice for: **image processing**.

```typescript
// filters.ts

/** Converts given pixel data to grayscale, input is an RGBA pixel byte array. */
export function pixelsToGrayscale(pixelData: Uint8Array): Uint8Array {
  // Output pixel data
  const o = new Uint8Array(pixelData.length);

  for (let i=0; i<pixelData.length; i+=4) {
    const r: f64 = pixelData[i]; // Note: this type annotation converts the byte value to a float64
    const g: f64 = pixelData[i+1]; // in standard JS this wouldn't be necessary.
    const b: f64 = pixelData[i+2];

    // We use CIE luminance for conversion to RGB
    const v: u8 = Math.round(0.2126*r + 0.7152*g + 0.0722*b) as u8;
    o[i] = o[i+1] = o[i+2] = v;
    o[3] = 255; // alpha value
  }
  return o;
};
```
The above example looks a lot like standard Typescript, for this example we had to add explicit type annotations (such as `f64`) for it to be valid AssemblyScript.

### Compiling to WASM using `asc`




### Compiling to JS using `tsc`

The above program can still be compiled to Javascript using the Typescript compiler (`tsc`), this is useful as a fallback for old browsers. This is a big advantage of AssemblyScript over languages such as C or Rust when targeting WebAssembly.[^1]

The numerical type annotations (`u8`, `f64`, etc) are aliased to `number` making it valid Typescript.

>⚠️The aliasing of `u8` and friends to `number` can lead to different outputs if you aren't careful! If you want to target both Javascript and WebAssembly you will have to keep this in mind. The [**portability**](https://www.assemblyscript.org/portability.html) section in the AssemblyScript documenation goes into more detail and gives tips.


<br>
<br>

[^1]: Technically those languages can also generate Javascript output using [emscripten](https://emscripten.org/), but that code will be anything but idiomatic JS and likely have very poor performance.