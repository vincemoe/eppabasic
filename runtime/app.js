﻿requirejs.config({
    baseUrl: window.location.protocol + "//" + window.location.host
            + window.location.pathname.split("/").slice(0, -1).join("/"),
    //urlArgs: "bust=" + (new Date()).getTime(),              // For development only TODO Remove
    paths: {
        runtime: 'runtime',
        jquery: '//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min',
        text: '../libs/requirejs_text',
        esrever: '../libs/esrever'
    }
});

// Require polyfill
require(['libs/fullscreen-api-polyfill']);
require(['libs/workershim2']);

// Require main
require(['runtime/main/main']);

require([
    // Preload polyfills...
    'libs/fullscreen-api-polyfill', 'libs/workershim2', 'runtime/polyfill',
    // ... and shims...
    'libs/es5-shim', 'libs/es6-shim'], function () {
        // Go to main
        require(['runtime/main/main']);
    }
);