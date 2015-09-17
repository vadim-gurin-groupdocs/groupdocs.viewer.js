(function ($) {
    "use strict";

    if (!window.groupdocs)
        window.groupdocs = {};

    window.groupdocs.bindingProvider = function () {
        this.create();
    };

    $.extend(window.groupdocs.bindingProvider.prototype, {
        providers: {},
        currentProviderName: null,
        provider: null,
        
        create: function () {
            this.provider = new this.providers[this.currentProviderName]();
        },

        registerProvider: function (providerName, providerConstructor) {
            window.groupdocs.bindingProvider.prototype.providers[providerName] = providerConstructor;
        },

        getProvider: function (providerName) {
            return window.groupdocs.bindingProvider.prototype.providers[providerName];
        },

        setCurrentProvider: function (providerName) {
            window.groupdocs.bindingProvider.prototype.currentProviderName = providerName;
        },


        getObservable: function (initialValue) {
            return this.provider.getObservable(initialValue);
        },

        getObservableArray: function (initialValue) {
            return this.provider.getObservableArray(initialValue);
        },

        getComputedObservable: function (functionParam) {
            return this.provider.getComputedObservable(functionParam);
        },

        createHtml: function (componentName, element, options) {
            return this.provider.createHtml(componentName, element, options);
        },

        applyBindings: function (viewModel, element) {
            this.provider.applyBindings(viewModel, element);
        }
    });
})(jQuery);