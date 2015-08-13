(function ($, undefined) {
    $.groupdocsWidget('zooming', {
        options: {
            zoomValues: [5, 15, 25, 50, 75, 100, 125, 150, 175, 200, 300, 400, 600]
        },
        _viewModel: null,
        _create: function () {
            this._viewModel = this.getViewModel();

            if (this.options.createHtml) {
                this._createHtml();
            }
        },

        getViewModel: function () {
            if (this._viewModel) {
                return this._viewModel;
            }
            var options = $.extend({ element: this.element }, this.options);
            var vm = new zoomingViewModel(options);
            return vm;
        },

        _createHtml: function () {
            var root = this.element;
            //this.element = $(
            //).appendTo(root);
            window.groupdocs.bindingProvider.createHtmlAndApplyBindings("paging", this._viewModel, this.element);

            root.trigger("onHtmlCreated");
        }
    });

    // Zooming Model
    zoomingModel = function () {
    };

    // Zooming ViewModel
    zoomingViewModel = function (options) {
        $.extend(this, options);
        this._init(options);
    };

    $.extend(zoomingViewModel.prototype, {
        _model: null,
        zooms: null,
        _currentZoom: null,
        _currentZoomIndex: 0,
        dropDownMenuIsVisible: null,
        dropDownMenuClicked: false,

        _init: function (options) {
            this.bindingProvider = window.groupdocs.bindingProvider;
            this._currentZoom = this.bindingProvider.getObservable(100);
            this.zooms = this.bindingProvider.getObservableArray([]);
            this.dropDownMenuIsVisible = this.bindingProvider.getObservable(false);

            var zoomValue;
            for (var i = options.zoomValues.length - 1; i >= 0; i--) {
                zoomValue = options.zoomValues[i];
                this.zooms.push({ name: zoomValue.toString() + "%", value: zoomValue });

                if (zoomValue == this.bindingProvider.getValue(this._currentZoom)) {
                    this._currentZoomIndex = this.zooms.length - 1;
                }
            }
            this.setFitWidthZoom(100);
            this.setFitHeightZoom(100);
        },

        setFitWidthZoom: function (fitWidthZoom) {
            var fitWidthItem = { name: "Fit Width", value: fitWidthZoom, localizationKey: "FitWidth", fitWidth: true };
            var found = false;
            var zooms = this.bindingProvider.getValue(this.zooms);
            for (var i = 0; i < this.zooms.length; i++) {
                if (zooms[i].fitWidth) {
                    //this.zooms.splice(i, 1, fitWidthItem);
                    zooms[i].value = fitWidthZoom;
                    found = true;
                    break;
                }
            }

            if (!found)
                this.zooms.push(fitWidthItem);
        },

        setFitHeightZoom: function (fitHeightZoom) {
            var fitHeightItem = { name: "Fit Height", value: fitHeightZoom, localizationKey: "FitHeight", fitHeight: true };
            var found = false;
            var zooms = this.bindingProvider.getValue(this.zooms);
            for (var i = 0; i < zooms.length; i++) {
                if (zooms[i].fitHeight) {
                    zooms[i].value = fitHeightZoom;
                    found = true;
                    break;
                }
            }

            if (!found)
                zooms.push(fitHeightItem);
        },

        getZoom: function () {
            return this.bindingProvider.getValue(this._currentZoom);
        },

        getFitWidthZoomValue: function () {
            var zoomItem;
            var zooms = this.bindingProvider.getValue(this.zooms);
            for (var i = 0; i < zooms.length; i++) {
                zoomItem = zooms[i];
                if (zoomItem.fitWidth) {
                    return zoomItem.value;
                }
            }
        },

        getFitHeightZoomValue: function () {
            var zoomItem;
            var zooms = this.bindingProvider.getValue(this.zooms);
            for (var i = 0; i < zooms.length; i++) {
                zoomItem = zooms[i];
                if (zoomItem.fitHeight) {
                    return zoomItem.value;
                }
            }
        },

        setZoom: function (item, e) {
            var zoom = item.value;
            var index = this._indexOfZoom(zoom);

            this.bindingProvider.setValue(this, "_currentZoom", zoom);
            if (index >= 0) {
                this._currentZoomIndex = index;
            }
            else {
                this._currentZoomIndex = this._indexOfNearestZoom(zoom, false);
            }
            this.element.trigger('onSetZoom', zoom);
            this.element.trigger("zoomSet.groupdocs", zoom);
        },

        setZoomWithoutEvent: function (zoom) {
            var index = this._indexOfZoom(zoom);
            if (index >= 0) {
                this.bindingProvider.setValue(this, "_currentZoom", zoom);
                this._currentZoomIndex = index;
            }
        },

        zoomIn: function () {
            var changed = false;
            var currentZoomIndex = this._currentZoomIndex;
            var zooms = this.bindingProvider.getValue(this.zooms);

            if (this._isFitToBounds()) {
                currentZoomIndex = this._indexOfNearestZoom(zooms[this._currentZoomIndex].value, true);
                changed = (currentZoomIndex >= 0);
            }
            else
                if (this._currentZoomIndex > 0) {
                    currentZoomIndex = this._currentZoomIndex - 1;
                    changed = true;
                }

            if (changed) {
                this._currentZoomIndex = currentZoomIndex;
                this.bindingProvider.setValue(this, "_currentZoom", zooms[this._currentZoomIndex].value);
                this.element.trigger('onSetZoom', this.bindingProvider.getValue(this._currentZoom));
                this.element.trigger("zoomSet.groupdocs", this.bindingProvider.getValue(this._currentZoom));
            }
        },

        zoomOut: function () {
            var changed = false;
            var currentZoomIndex = this._currentZoomIndex;
            var zooms = this.bindingProvider.getValue(this.zooms);

            if (this._isFitToBounds()) {
                currentZoomIndex = this._indexOfNearestZoom(zooms[this._currentZoomIndex].value, false);
                changed = (currentZoomIndex >= 0);
            }
            else
                if (this._currentZoomIndex < zooms.length - 1 &&
                    !(zooms[this._currentZoomIndex + 1].fitWidth || zooms[this._currentZoomIndex + 1].fitHeight)) {
                    currentZoomIndex = this._currentZoomIndex + 1;
                    changed = true;
                }

            if (changed) {
                this._currentZoomIndex = currentZoomIndex;
                this.bindingProvider.setValue(this, "_currentZoom", zooms[this._currentZoomIndex].value);
                this.element.trigger('onSetZoom', this.bindingProvider.getValue(this._currentZoom));
                this.element.trigger("zoomSet.groupdocs", this.bindingProvider.getValue(this._currentZoom));
            }
        },

        _indexOfZoom: function (value) {
            var zooms = this.bindingProvider.getValue(this.zooms);
            for (i = 0; i < zooms.length; i++) {
                if (zooms[i].value == value) {
                    return i;
                }
            }

            return -1;
        },

        _indexOfNearestZoom: function (value, greater) {
            var zooms = this.bindingProvider.getValue(this.zooms);
            var startIndex = zooms.length - 1;
            var nearestGreaterValue = null, nearestGreaterValueIndex = null,
                nearestSmallerValue = null, nearestSmallerValueIndex = null;
            var current, currentElement;

            for (i = startIndex; i >= 0; i--) {
                currentElement = zooms[i];
                current = currentElement.value;
                if (!currentElement.fitWidth && !currentElement.fitHeight) {
                    if (current > value && (nearestGreaterValue === null || current < nearestGreaterValue)) {
                        nearestGreaterValue = current;
                        nearestGreaterValueIndex = i;
                    }
                    else if (current < value && (nearestSmallerValue === null || current > nearestSmallerValue)) {
                        nearestSmallerValue = current;
                        nearestSmallerValueIndex = i;
                    }
                }
            }

            if (greater) {
                if (nearestGreaterValueIndex === null)
                    return -1;
                else
                    return nearestGreaterValueIndex;
            }
            else {
                if (nearestSmallerValueIndex === null)
                    return -1;
                else
                    return nearestSmallerValueIndex;
            }
        },

        _isFitToBounds: function () {
            var zooms = this.bindingProvider.getValue(this.zooms);
            return (zooms[this._currentZoomIndex].fitWidth || zooms[this._currentZoomIndex].fitHeight);
        },

        showDropDownMenu: function (show) {
            this.bindingProvider.setValue(this, "dropDownMenuIsVisible", show);
        },

        toggleDropDownMenu: function (viewModel, event) {
            this.bindingProvider.setValue(this, "dropDownMenuIsVisible", !this.bindingProvider.getValue(this.dropDownMenuIsVisible));
            this.dropDownMenuClicked = true;
            this.element.trigger("onMenuClicked");
            if (event)
                event.stopPropagation();
        }
    });
})(jQuery);
