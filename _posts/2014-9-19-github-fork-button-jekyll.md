---
layout: post
title: Github fork button link in Jekyll posts
excerpt: "Want to add a link to allow others to easily propose changes to your posts? Here's how."
modified: 2013-05-31
tags: [beginner, jekyll, tutorial]
comments: true
---

I recently added a link to the bottom of every post to allow others to easily submit a pull request. This can be useful if your posts have code examples that may get outdated, or just for small typos. Readers can propose changes via a pull request on Github.


It is possible since Jekyll 2.4.0 (april 2013), so ensure you have a recent enough version.

##Here's how

The secret is using`{% raw %} {{page.filename}}.{% endraw %}` to get the filename of the file. This will work on any page (not just posts).
Add the following to the layout of your posts.

For a project github page:
{% highlight html %}
{% raw %}
<a href="https://github.com/GITHUB-USERNAME/PROJECT-NAME/edit/gh-pages/{{page.filename}}" class="btn">Fork this post!</a>
{% endraw %}
{% endhighlight %}
----
For a personal github page:
{% highlight html %}
{% raw %}
<a href="https://github.com/GITHUB-USERNAME/GITHUB-USERNAME.github.io/edit/master/{{page.filename}}" class="btn">Fork this post!</a>
{% endraw %}
{% endhighlight %}


----
On my blog they are test links with a small icon. Here's what I use
{% highlight html %}
{% raw %}
<span class="git-pull">Something outdated or wrong in this post? <a href="https://github.com/Rahazan/rahazan.github.io/edit/master/{{page.path}}"><i class="fa fa-github fa-lg"></i> Submit a pull request!</a></span>
{% endraw %}
{% endhighlight %}
