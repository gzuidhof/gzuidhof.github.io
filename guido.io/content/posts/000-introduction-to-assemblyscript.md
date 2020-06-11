---
title: "An introduction to AssemblyScript"
date: 2020-06-10
slug: "introduction-to-assemblyscript"
description: "An introduction to AssemblyScript for image processing. AssemblyScript is a compiled subset of Typescript that targets WebAssembly."
keywords: []
draft: false
tags: ["assemblyscript"]
stylesheet: "post.css"
---

<p style="font-size: 1.2em; font-weight: bold">⚠️ I am still writing this article, consider this an unfinished first draft.</p>

[**AssemblyScript**](https://www.assemblyscript.org/) is a programming language that is almost the same as [**Typescript**](https://www.typescriptlang.org/) and compiles to [**WebAssembly**](https://webassembly.org/). 

WebAssembly allows near-native speed for programs that rely on heavy computation with smaller binaries. Any modern browser nowadays supports it as well as [**Deno**](https://deno.land/) and [**Node**](https://nodejs.org/en/). It will not replace Javascript itself anytime soon, but for some problems it can be a good choice, especially those that involve extensive computation.

In my opinion Assemblyscript is the easiest way to get started with WebAssembly today, especially if you are already familiar with Typescript.

## An image processing example

Instead of showing a game of life implementation, I want to show examples for a usecase that WebAssembly may actually be the right choice for: **image processing**.

```typescript
// assembly/filters.ts

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

## Compiling our program
We compile our grayscale filter routine to both to WebAssembly and plain Javascript.

### Compiling to WASM using `asc`
We can compile the above script to an optimized build by running  
```asc assembly/filters.ts -b build/filters.wasm -t build/filters.wat -d build/filters.d.ts -O3 --runtime stub```

There are three output files:

#### Webassembly binary file `filters.wasm`:
We chose the `stub` [**runtime**](https://www.assemblyscript.org/runtime.html), which generates a build that is easy to interact with from Javascript using the `@assemblyscript/loader` package.
This build however does not include an automatic garbage collector so it is only suitable for programs with a small memory footprint. For this demo it means a smaller build and won't hurt, but in real world applications please think twice. The generated `.wasm` code is **1.28KB** in size.

If we switch to the `full` runtime the binary size becomes **3.44KB**, and with the most barebones runtime `none` the output is **1.14KB**. We could still hack off a few hundred bytes[^2], but even with the full runtime it's only a few KB in size! This compares favourably against other languages compiled to WebAssembly: In AssemblyScript we can write idiomatic Typescript code and still get tiny binaries.

#### WebAssembly text repesentation file `filters.wat`
The `wat` file is a [text representation of wasm code](https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format) that you can open in an editor, you wouldn't ship it in production but it can provide insights into the generated code. It's roughly 9KB in size so it's a bit large to display here, a link to the GitHub repository with all example code can be found at the bottom.

#### Typescript definition file `filters.d.ts`

This contains the Typescript definition files for the AssemblyScript generated WASM module.
```typescript
// build/filters.d.ts

declare module ASModule { // Note I compressed the next 3 lines manually
  type i8 = number; type i16 = number; type i32 = number; type i64 = BigInt; type isize = number;
  type u8 = number; type u16 = number; type u32 = number; type u64 = BigInt; type usize = number;
  type f32 = number; type f64 = number; type bool = any;
  export function __alloc(size: usize, id: u32): usize;
  export function __retain(ref: usize): usize;
  export function __release(ref: usize): void;
  export function __collect(): void;
  export function __reset(): void;
  export var __rtti_base: usize;
  export function pixelsToGrayscale(pixelData: usize): usize;
}
export default ASModule;
```

### Compiling to JS using `tsc`

The above program can be compiled to Javascript using the Typescript compiler (`tsc`), this is useful as a fallback for old browsers. This is a big advantage of AssemblyScript over languages such as C or Rust when targeting WebAssembly.[^1].

The numerical type annotations (`u8`, `f64`, etc) are aliased to `number` making it valid Typescript. This requires you to add a types file to your `tsconfig.json`, otherwise `tsc` will not know about these types.

>⚠️The aliasing of `u8` et al. to `number` can lead to different outputs if you aren't careful! If you want to target both Javascript and WebAssembly you will have to keep this in mind. The [**portability**](https://www.assemblyscript.org/portability.html) section in the AssemblyScript documenation goes into more detail and gives tips.

We run ```tsc -p assembly -t ES2017 -m ES6 --outDir build```, which creates pretty much the same file but without the type annotations. It's **207 bytes** minified.

```javascript
//build/filters.js

/** Converts given pixel data to grayscale, input is an RGBA pixel byte array. */
export function pixelsToGrayscale(pixelData) {
    // Output pixel data
    const o = new Uint8Array(pixelData.length);
    for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i]; // Note: this type annotation converts the byte value to a float64
        const g = pixelData[i + 1]; // in standard JS this wouldn't be necessary.
        const b = pixelData[i + 2];
        // We use CIE luminance for conversion to RGB
        const v = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        o[i] = o[i + 1] = o[i + 2] = v;
        o[3] = 255; // alpha value
    }
    return o;
}
;
```

### Compiling to JS using `asc`
Finally, it is also possible to Javascript through the AssemblyScript compiler, this will output **asm.js**-style code with the same interface as the other `asc` build above.
A reason to use this compilation path instead of `tsc` could be if you needed to ensure equivalence between the JS and WASM version of your program (especially the numerical type differences need care otherwise), as well as the same interface. It's a good fit if you only ever fall back to JS for the oldest of browsers (do make sure that it is dynamically downloaded only for those users).

We build it using ```asc assembly/filters.ts -j build/filtersASM.js -O3 --runtime stub```, the built JS file is **10.3KB** in size (**5.0KB** minified).


## Calling our routine

Next let's use the code we wrote to make an image grayscale, and then draw it to a canvas. First some code to load the image and get its imagedata:
```javascript

```

### JS build
...

### WASM build
...


## Links
* [**Example code on GitHub**](https://github.com/gzuidhof/gzuidhof.github.io/tree/master/examples/assemblyscript/image-processing)


<br>
<br>

[^1]: Technically those languages can also generate Javascript output using [emscripten](https://emscripten.org/), but that code will be anything but idiomatic JS and likely have very poor performance.
[^2]: If we did not use `Uint8Array` but instead would use more low level `u8` arrays it could be even smaller. Also we could disable bounds checks on array access, which would also slightly speed things up.