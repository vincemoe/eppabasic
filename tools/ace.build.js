﻿define(['ace/config'], function (config) {
    config.set('packaged', true);
    config.set('basePath', 'build');
});
require(['tools/ace.build']);