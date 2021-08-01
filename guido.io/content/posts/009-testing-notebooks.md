---
title: "Testing web-based notebooks"
date: 2021-07-31
slug: "testing-notebooks"
description: "Testing notebooks is tricky, I built Starlit - a tool for testing Starboard Notebook files"
keywords: []
draft: false
tags: ["notebook", "starboard", "testing", "starlit"]
stylesheet: "post.css"
---
Notebook systems for literate programming are increasingly popular. I'm talking about tools that allow you to mix code, text and rich content like [Jupyter](https://jupyter.org), [Observable](https://observablehq.com), and [Starboard](https://starboard.gg).

For Starboard I wanted to be able to make changes to Starboard itself and plugins while being confident everything still works end to end.

## Testing in Jupyter

The most serious tool I could find for Jupyter is [testbook](https://github.com/nteract/testbook) (part of the nteract ecosystem). This tool seems to follow a pattern that I saw used in other Jupyter testing setups: notebooks are treated a `.py` files, which allows us to test it as any other Python file.

This feels wrong, why not put this function in a separate file anyway and import it into the notebook? In my opinon, a notebook should present a narrative, serve as your experimentation bed, or allow the user to learn or *do* something.

What if we want to test the actual notebook itself and not just its individual functions? What does that even mean? In short: I want to ensure I can run all the cells in the notebook start to end without any uncaught errors.

## How Starboard is different

[Starboard](https://starboard.gg) is a multi-language notebook system that runs natively in the browser, for Python support it relies on WebAssembly-powered [Pyodide](https://). By being 100% static in the browser, given you have all the files on a static host and a modern browser - it should work forever. It also allows you to embed (small) notebooks into webpages, let's embed one right here:

{{< starboardwrap >}}

{{< starboardembed >}}
# %% [javascript]
// Press the play button the left to run this cell :)
const name = "Starboard";
console.log(`Hello ${name}!`);

// We can import libraries dynamically, this one formats millisecond durations
const {default: prettyMs} = await import("https://cdn.skypack.dev/pretty-ms");
prettyMs(123456789)
{{< /starboardembed >}}

Here's what such an embed looks like:
```html
<script type="module" src="https://unpkg.com/starboard-wrap@0.4.0/dist/index.js" defer></script>

<starboard-embed>
<script type="starboard">
# %% [javascript]
// Press the play button the left to run this cell :)
const name = "Starboard";
console.log(`Hello ${name}!`);

// We can import libraries dynamically, this one formats millisecond durations
const {default: prettyMs} = await import("https://cdn.skypack.dev/pretty-ms");
prettyMs(123456789)
</script>
</starboard-embed>
```

Other than Jupyter, this is fully interactive: you can change the code, re-run cells, and really do whatever you want. For me hosting this blog: I don't have to supply you with a machine to evaluate the code you type (and deal with people using those machines for mining cryptocurrencies).

You can hopefully imagine this being useful as interactive documentation, articles or tutorials. And with these small embeds you can put it inside existing blogs and websites :).

## A less trivial example
Imagine the following example notebook which
* Downloads a CSV file using fetch.
* Loads it into pandas and perform some preprocessing.
* Visualizes it using Matplotlib.

> (Note: running this notebook requires downloading and running the Pyodide runtime, which may take a moment the first time you do it)

{{< starboardembed >}}
# %% [python]
from js import fetch
import io
import pandas as pd

url = "https://cdn.jsdelivr.net/gh/selva86/datasets/mtcars.csv"
csv_content = await (await fetch(url)).text()

df = pd.read_csv(io.StringIO(csv_content))

x = df.loc[:, ['mpg']]
df['mpg_z'] = (x - x.mean())/x.std()
df['colors'] = ['red' if x < 0 else 'green' for x in df['mpg_z']]
df.sort_values('mpg_z', inplace=True)
df.reset_index(inplace=True)
df
# %% [python]
import matplotlib.pyplot as plt

# Draw plot
plt.figure(figsize=(7,6), dpi= 80)
plt.hlines(y=df.index, xmin=0, xmax=df.mpg_z, color=df.colors, alpha=0.4, linewidth=5)

# Decorations
plt.gca().set(ylabel='$Model$', xlabel='$Mileage$ (standard deviations)')
plt.yticks(df.index, df.cars, fontsize=8)
plt.title('Diverging Bars of Car Mileage', fontdict={'size':16})
plt.grid(linestyle='--', alpha=0.5)
plt.show()
{{< /starboardembed >}}

How do we test the above notebook? It is hard to capture all the things going on here in unit tests. As Starboard Notebook itself gets developed, it is tedious to manually click through multiple notebooks to ensure things are still working. Let's automate that.

## Introducing Starlit nbtest
To solve this issue I wrote a tool in Go called [Starlit nbtest](https://github.com/gzuidhof/starlit) that runs all the cells of a notebook in a headless browser. One invokes it as follows:

```bash
# Runs all notebooks under some/path
starlit nbtest some/path/
```

The binary starts a local http server that serves all the required files. The excellent [chromedp](https://github.com/chromedp/chromedp) package then allows us to talk to a headless browser, opening every notebook's test page in a separate tab. Notebooks can be pretty slow (e.g. loading Pyodide will take seconds on a less powerful device), so being able to run multiple in parallel as well as keeping overhead down is important. Being written in Go helps.

![Example nbtest output](https://i.imgur.com/yAUcNk4.png)
> Given enough cores, the total time taken to run the tests is usually determined by the slowest running notebook (and not the sum of all notebooks which it would be if we ran all tests serially).

With this tool I can create a corpus of notebooks that *should* just work. If someone runs into a bug, I can copy paste their notebook into this corpus.

Note that often one would actually add some assertions at the end. In the above notebook we could add a Javascript cell at the end with the following code:

```javascript
function assert(condition, message) {
    if (!condition)
        throw Error('Assert failed: ' + (message || ''));
};

assert(document.querySelector("canvas") !== null, "A canvas element should be present after plotting.");
```

## Distributing on NPM
It turns out distributing a binary through NPM was surprisingly painful. This was especially surprising given that web tooling is increasingly written in Go and Rust for speed.

There is one package [`go-npm`](https://www.npmjs.com/package/go-npm) that helps with distributing Go binaries through NPM, but in true Node style it pulls in 69 additional packages to do that, is broken for Windows users, and is no longer actively maintained. I [forked the package](https://github.com/gzuidhof/go-npm) fixing some of these issues (getting rid of all the dependencies), but the package is still far from ideal.

But I'm satisfied, I can run my tests automatically on [Github Actions](https://github.com/gzuidhof/starboard-notebook/blob/master/package.json#L28) using a single binary that I can install through `npm i --save-dev starlit`.

## Looking forward
Most programming examples, courses, articles, and documentation nowadays have static code examples you can't run right then and there.

The [starlit](https://github.com/gzuidhof/starlit) tool is mostly a static site generator (which is still a work in progress!). The goal is that you point to a folder of markdown and starboard notebook files, and it spits out a static website.

Think Gitbook with notebook superpowers - and it's truly open source :). This nbtest tool will help keep your content from going stale. I suppose it's a form of doctest on steroids?
