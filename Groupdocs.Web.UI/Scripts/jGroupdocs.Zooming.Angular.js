(function ($, undefined) {
    $.groupdocsWidget('zooming', {
        options: {
            zoomValues: [5, 15, 25, 50, 75, 100, 125, 150, 175, 200, 300, 400, 600]
        },
        _viewModel: null,
        _create: function () {
            if (this.options.createHtml) {
                this._createHtml();
            }
            var app = angular.module("groupdocs.viewer", []);
            app.controller("zooming", function ($scope) {

            });
            this._viewModel = this.getViewModel();
            

            $(this._viewModel).bind('onSetZoom', function (e, value) {
                $(this.element).trigger('onSetZoom', [value]);
            } .bind(this));

            $(this._viewModel).bind("zoomSet.groupdocs", function (e, value) {
                this.element.trigger("zoomSet.groupdocs", [value]);
            } .bind(this));
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
            this.element = $(
'<div data-ng-app="groupdocs.viewer" class="left">' +
'    <a class="new_head_tools_btn h_t_i_zoomin" href="#" data-bind="click: zoomIn" data-tooltip="Zoom In" data-localize-tooltip="ZoomIn"> </a>' +
'    <a class="new_head_tools_btn h_t_i_zoomout" href="#" data-bind="click: zoomOut" data-tooltip="Zoom Out" data-localize-tooltip="ZoomOut"> </a>' +
'    <div class="new_head_tools_dropdown_wrapper">' +
'        <a class="new_head_tools_btn head_tool_dropdown_btn h_t_i_zoom" href="#" data-bind="click: toggleDropDownMenu" data-tooltip="Zoom Level" data-localize-tooltip="ZoomLevel">' +
'        </a>' +
'        <ul class="dropdown-menu head_tool_dropdown" style="display: none;" data-bind="style: {display: (dropDownMenuIsVisible() ? \'block\' : \'none\')}, foreach: zooms">' +
'            <li>' +
'                <a href="#" data-bind="text: name, event: { mousedown: function(item, e) { $parent.setZoom(item, e); } }, attr: {\'data-localize\': $data.localizationKey }"></a>' +
'            </li>' +
'        </ul>' +
'    </div>' +
'</div>'

            ).appendTo(root);
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
            this._currentZoom = ko.observable(100);
            this.zooms = ko.observableArray([]);
            this.dropDownMenuIsVisible = ko.observable(false);

            var zoomValue;
            for (var i = options.zoomValues.length - 1; i >= 0; i--) {
                zoomValue = options.zoomValues[i];
                this.zooms.push({ name: zoomValue.toString() + "%", value: zoomValue });

                if (zoomValue == this._currentZoom()) {
                    this._currentZoomIndex = this.zooms().length - 1;
                }
            }
            this.setFitWidthZoom(100);
            this.setFitHeightZoom(100);
        },

        setFitWidthZoom: function (fitWidthZoom) {
            var fitWidthItem = { name: "Fit Width", value: fitWidthZoom, localizationKey: "FitWidth", fitWidth: true };
            var found = false;
            for (var i = 0; i < this.zooms().length; i++) {
                if (this.zooms()[i].fitWidth) {
                    //this.zooms.splice(i, 1, fitWidthItem);
                    this.zooms()[i].value = fitWidthZoom;
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
            for (var i = 0; i < this.zooms().length; i++) {
                if (this.zooms()[i].fitHeight) {
                    //this.zooms.splice(i, 1, fitHeightItem);
                    this.zooms()[i].value = fitHeightZoom;
                    found = true;
                    break;
                }
            }

            if (!found)
                this.zooms.push(fitHeightItem);
        },

        getZoom: function () {
            return this._currentZoom();
        },

        getFitWidthZoomValue: function () {
            var zoomItem;
            for (var i = 0; i < this.zooms().length; i++) {
                zoomItem = this.zooms()[i];
                if (zoomItem.fitWidth) {
                    return zoomItem.value;
                }
            }
        },

        getFitHeightZoomValue: function () {
            var zoomItem;
            for (var i = 0; i < this.zooms().length; i++) {
                zoomItem = this.zooms()[i];
                if (zoomItem.fitHeight) {
                    return zoomItem.value;
                }
            }
        },

        setZoom: function (item, e) {
            var zoom = item.value;
            var index = this._indexOfZoom(zoom);

            this._currentZoom(zoom);
            if (index >= 0) {
                this._currentZoomIndex = index;
            }
            else {
                this._currentZoomIndex = this._indexOfNearestZoom(zoom, false);
            }
            $(this).trigger('onSetZoom', zoom);
            $(this).trigger("zoomSet.groupdocs", zoom);
        },

        setZoomWithoutEvent: function (zoom) {
            var index = this._indexOfZoom(zoom);
            if (index >= 0) {
                this._currentZoom(zoom);
                this._currentZoomIndex = index;
            }
        },

        zoomIn: function () {
            var changed = false;
            var currentZoomIndex = this._currentZoomIndex;

            if (this._isFitToBounds()) {
                currentZoomIndex = this._indexOfNearestZoom(this.zooms()[this._currentZoomIndex].value, true);
                changed = (currentZoomIndex >= 0);
            }
            else
                if (this._currentZoomIndex > 0) {
                    currentZoomIndex = this._currentZoomIndex - 1;
                    changed = true;
                }

            if (changed) {
                this._currentZoomIndex = currentZoomIndex;
                this._currentZoom(this.zooms()[this._currentZoomIndex].value);
                $(this).trigger('onSetZoom', this._currentZoom());
                $(this).trigger("zoomSet.groupdocs", this._currentZoom());
            }
        },

        zoomOut: function () {
            var changed = false;
            var currentZoomIndex = this._currentZoomIndex;

            if (this._isFitToBounds()) {
                currentZoomIndex = this._indexOfNearestZoom(this.zooms()[this._currentZoomIndex].value, false);
                changed = (currentZoomIndex >= 0);
            }
            else
                if (this._currentZoomIndex < this.zooms().length - 1 &&
                    !(this.zooms()[this._currentZoomIndex + 1].fitWidth || this.zooms()[this._currentZoomIndex + 1].fitHeight)) {
                    currentZoomIndex = this._currentZoomIndex + 1;
                    changed = true;
                }

            if (changed) {
                this._currentZoomIndex = currentZoomIndex;
                this._currentZoom(this.zooms()[this._currentZoomIndex].value);
                $(this).trigger('onSetZoom', this._currentZoom());
                $(this).trigger("zoomSet.groupdocs", this._currentZoom());
            }
        },

        _indexOfZoom: function (value) {
            for (i = 0; i < this.zooms().length; i++) {
                if (this.zooms()[i].value == value) {
                    return i;
                }
            }

            return -1;
        },

        _indexOfNearestZoom: function (value, greater) {
            var startIndex = this.zooms().length - 1;
            var nearestGreaterValue = null, nearestGreaterValueIndex = null,
                nearestSmallerValue = null, nearestSmallerValueIndex = null;
            var current, currentElement;

            for (i = startIndex; i >= 0; i--) {
                currentElement = this.zooms()[i];
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
            return (this.zooms()[this._currentZoomIndex].fitWidth || this.zooms()[this._currentZoomIndex].fitHeight);
        },

        showDropDownMenu: function (show) {
            this.dropDownMenuIsVisible(show);
        },

        toggleDropDownMenu: function (viewModel, event) {
            this.dropDownMenuIsVisible(!this.dropDownMenuIsVisible());
            this.dropDownMenuClicked = true;
            this.element.trigger("onMenuClicked");
            event.stopPropagation();
        }

        //isDropDownMenuClicked: function () {
        //    var dropDownMenuClicked = this.dropDownMenuClicked;
        //    this.dropDownMenuClicked = false;
        //    return dropDownMenuClicked;
        //}
    });
})(jQuery);
