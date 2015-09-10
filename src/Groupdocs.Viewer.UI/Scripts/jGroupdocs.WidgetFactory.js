(function ($) {
    "use strict";

    if (!window.groupdocs)
        window.groupdocs = {};

    window.groupdocs.getWidgetInstance = function (pluginDataKey, widgetObject, options) {
        var widgetInstance;
        var pluginData = this.data(pluginDataKey);
        if (pluginData == undefined) {
            widgetInstance = $.extend({}, widgetObject);
            widgetInstance.element = this;
            widgetInstance.widgetName = pluginDataKey;
            if (widgetInstance.options == undefined)
                widgetInstance.options = options;
            else {
                var resultOptions = $.extend({}, widgetInstance.options, options);
                widgetInstance.options = resultOptions;
            }
            if (widgetInstance._create)
                widgetInstance._create();
            if (widgetInstance._init)
                widgetInstance._init();
            this.data(pluginDataKey, widgetInstance);
        }
        else
            widgetInstance = pluginData;
        return widgetInstance;
    };


    $.groupdocsWidget = function (widgetName, widgetObject) {
        $.fn[widgetName] = function (param) {
            var widgetInstance = window.groupdocs.getWidgetInstance.call(this, widgetName, widgetObject, param);
            if (typeof param == "object" || typeof param == "undefined") {
                return this;
            }
            else {
                return widgetInstance[param].apply(widgetInstance, Array.prototype.slice.call(arguments, 1, arguments.length));
            }
        };
    }
})(jQuery);