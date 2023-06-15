'use strict';

function toggleMobileNavState() {
  var body = document.querySelector('body');
  body.classList.toggle('nav--active');
}

function initBurger() {
  var burger = document.querySelector('.burger');
  burger.addEventListener('click', toggleMobileNavState);
}

initBurger();