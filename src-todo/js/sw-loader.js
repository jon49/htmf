"use strict";
(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
        .register(`${document.location.pathname}sw.js`)
        .then(_ => {
            console.log("Service worker registered.")
        })
    } else {
        alert("Service worker is not supported. Please use a modern browser.")
    }
})()

