---
layout: post
title: Gamedev.tip.fish, personal project
tags: [project, hugo, gamedev.tip.fish, haxe]
comments: true
---

I switched to [hugo](http://gohugo.io) after trying multiple static site generators. It's very fast, easy to work with and doesn't force me to layout my site any specific way.

[gamedev.tip.fish](http://gamedev.tip.fish) is a small project I started to become more familiar with devops, basic web design and tooling. On the site, daily a game development tip appears, which is also tweeted.

Some features:
* It now runs fully automated, all I have to do is add tips every now and then. 
* My staged tips are verified using a simple test program on travis-ci, which also deploys the site to Github Pages. 
* The tool is written in haxe, which is then compiled to a java executable to use the Twitter4J library.
* A small vps has a daily cronjob, which runs a tool that publishes a staged post and pushes it to GitHub.

Pretty awesome.