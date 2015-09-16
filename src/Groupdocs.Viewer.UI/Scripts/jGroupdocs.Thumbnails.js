(function ($, undefined) {
    "use strict";

    $.groupdocsWidget('thumbnails', {
        _viewModel: null,
        
        options: {
            quality: null,
            supportPageRotation: false,
            emptyImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        },

        _create: function() {
            this.bindingProvider = new window.groupdocs.bindingProvider();
            this.options.bindingProvider = this.bindingProvider;

            this.options.element = this.element;
            this.useHtmlThumbnails = this.options.useHtmlThumbnails;
            this.useHtmlBasedEngine = this.options.useHtmlBasedEngine;
            this.emptyImageUrl = this.options.emptyImageUrl;
            if (this.options.supportPageReordering) {
                var self = this;
            }

            if (this.options.createHtml) {
                this._createHtml();
            }

            if (this.options.thumbnailWidth)
                this._thumbnailWidth = this.options.thumbnailWidth;

            this._viewModel = this.getViewModel();
            this.bindingProvider.applyBindings(this._viewModel, this.options.thumbnailPanelElement ? this.options.thumbnailPanelElement : this.options.element);
        },

        _createViewModel: function() {
            var viewModel = new window.groupdocs.thumbnailsViewModel(this.options);
            return viewModel;
        },

        getViewModel: function() {
            if (!this._viewModel) {
                this._viewModel = this._createViewModel();
            }
            return this._viewModel;
        },

        _createHtml: function () {
            var result = this.bindingProvider.createHtml("thumbnails", this.element, this.options);
            this.options.element = result.element;
            this.options.thumbnailPanelElement = result.thumbnailPanelElement;
            this.options.toggleThumbnailsButton = result.toggleThumbnailsButton;
            this.options.rootElement = result.rootElement;
        }
    });


    window.groupdocs.thumbnailsModel = function (options) {
        this._create(options);
    };

    $.extend(window.groupdocs.thumbnailsModel.prototype, {
        _portalService: Container.Resolve("ServerExchange"),

        _create: function (options) {
            this.options = options;
        },

        retrieveImageUrls: function(documentPath, thumbnailWidth, pageNumber, imageCount,
                                    successHandler, errorHandler) {
            this._portalService.getImageUrlsAsync(documentPath,
                thumbnailWidth, pageNumber, imageCount,
                this.options.quality, false, null, null, null, null,
                this.options.ignoreDocumentAbsence,
                this.options.useHtmlBasedEngine, this.options.supportPageRotation,
                this.options.instanceIdToken,
                this.options.locale,
                function(response) {
                    successHandler(response);
                }.bind(this),
                function(error) {
                    errorHandler(error);
                }.bind(this)
            );
        }
    });

    window.groupdocs.thumbnailsViewModel = function (options) {
        this._create(options);
    };

    $.extend(window.groupdocs.thumbnailsViewModel.prototype, {
        _pageCount: 0,
        _documentPath: '',
        _heightWidthRatio: 0,
        _thumbnailWidth: 150,

        thumbnails: null,
        pageInd: null,
        pageCount: null,
        busy: null,

        _thumbnailHeight: null,
        useInnerThumbnails: false,
        openThumbnails: null,
        element: null,
        rootElement: null,
        thumbnailPanelElement: null,
        emptyImageUrl: null,
        scale: null,

        _create: function (options) {
            this.options = options;
            this._init(options);
        },

        _init: function (options) {
            this.bindingProvider = this.options.bindingProvider;
            this._model = new window.groupdocs.thumbnailsModel(options);

            this.thumbnails = this.bindingProvider.getObservableArray([]);
            this.pageInd = this.bindingProvider.getObservable(1);
            this.pageCount = this.bindingProvider.getObservable(0);
            this.busy = this.bindingProvider.getObservable(true);
            this._thumbnailHeight = this.bindingProvider.getObservable(201);
            this.useInnerThumbnails = options.useInnerThumbnails;
            this.openThumbnails = this.bindingProvider.getObservable(options.openThumbnails);
            this.element = options.element;
            this.rootElement = options.rootElement;
            this.thumbnailPanelElement = options.thumbnailPanelElement;
            this.emptyImageUrl = options.emptyImageUrl;
            if (this.useHtmlThumbnails)
                this.scale = this.bindingProvider.getObservable(0);
        },

        scrollThumbnailsPanel: function (e) {
            this._onScrollThumbnailsPanel(e);
        },

        selectPage: function (pageIndex) {
            this.set(pageIndex);
        },

        showThumbnails: function (show) {
            var thumbnail;
            for (var i = 0; i < this.thumbnails().length; i++) {
                thumbnail = this.thumbnails()[i];
                thumbnail.visible(show);
            }
        },

        hideThumbnails: function () {
            this.showThumbnails(false);
        },

        getThumbnailsPanelWidth: function () {
            var thumbnailsPanelWidth = 0;
            if (this.useInnerThumbnails)
                thumbnailsPanelWidth = this.element.parent().width();
            return thumbnailsPanelWidth;
        },

        toggleThumbnails: function () {
            this.openThumbnails(!this.openThumbnails());
            if (this.useInnerThumbnails) {
                var thumbnailStripeWidth = this.thumbnailPanelElement.children(".thumbnail_stripe").width();
                var thumbnailContainerWidth = parseInt(this.element.css("width"));
                var borderWidth = 1;
                var resultWidth = thumbnailStripeWidth;
                if (this.openThumbnails())
                    resultWidth += thumbnailContainerWidth + borderWidth;
                this.rootElement.trigger("onResizeThumbnails", resultWidth);
            }
        },

        onProcessPages: function (data, pages, getDocumentPageHtmlCallback, viewerViewModel, pointToPixelRatio, docViewerId) {
            this._documentPath = data.path ? data.path : data.guid;
            this.pageCount(data.pageCount);

            var width = this._thumbnailWidth;
            var variablePageSizeSupport = false, pageDescriptions = null, maxPageHeight, widthForMaxHeight;
            var thumbnailWrapperHeight = null;
            var baseScale;
            if (data.documentDescription && data.documentDescription.pages) {
                variablePageSizeSupport = true;
                pageDescriptions = data.documentDescription.pages;
                maxPageHeight = data.documentDescription.maxPageHeight;
                widthForMaxHeight = data.documentDescription.widthForMaxHeight;
                this._heightWidthRatio = parseFloat(maxPageHeight / widthForMaxHeight);
                thumbnailWrapperHeight = maxPageHeight / widthForMaxHeight * this._thumbnailWidth;
                baseScale = (thumbnailWrapperHeight / maxPageHeight) / pointToPixelRatio;
                if (this.useHtmlThumbnails) {
                    this.getDocumentPageHtmlCallback = getDocumentPageHtmlCallback;
                    this.viewerViewModel = viewerViewModel;
                    this.docViewerId = docViewerId;
                    var thumbnailContainerWidth = this.element.width();
                }
            }

            var notObservableThumbnails = [];
            var thumbnailDescription, verticalPadding, thumbnailWidth, thumbnailHeight, backgroundColor;
            var spinnerHeight = 47;
            var pageCount = this.pageCount();
            var pageWidth, pageHeight, scaleRatio;
            var thumbLeftCoord;
            for (var i = 0; i < pageCount; i++) {
                thumbnailDescription = {
                    number: i + 1,
                    busy: this.bindingProvider.getObservable(true),
                    visible: this.bindingProvider.getObservable(false),
                    url: this.bindingProvider.getObservable(this.emptyImageUrl)
                };

                if (i < pageDescriptions.length) {
                    pageWidth = pageDescriptions[i].w;
                    pageHeight = pageDescriptions[i].h;
                    var prop = pageHeight / pageWidth;
                    var rotation = pageDescriptions[i].rotation;
                    if (typeof rotation == "undefined")
                        rotation = 0;
                    if (rotation % 180 != 0)
                        prop = 1 / prop;
                    thumbnailWidth = this._thumbnailWidth;
                    thumbnailHeight = this._thumbnailWidth * prop;
                    if (thumbnailHeight > thumbnailWrapperHeight) {
                        scaleRatio = thumbnailWrapperHeight / thumbnailHeight;
                        thumbnailHeight = thumbnailWrapperHeight;
                        thumbnailWidth = this._thumbnailWidth * scaleRatio;
                    }
                }
                else {
                    thumbnailWidth = this._thumbnailWidth;
                    thumbnailHeight = 215;
                }
                thumbnailDescription.width = this.bindingProvider.getObservable(thumbnailWidth);
                thumbnailDescription.height = this.bindingProvider.getObservable(thumbnailHeight);
                verticalPadding = 0;
                backgroundColor = "";
                if (thumbnailHeight < spinnerHeight) {
                    verticalPadding = ((spinnerHeight - thumbnailHeight) / 2).toString();
                    backgroundColor = "white";
                }
                thumbnailDescription.verticalPadding = this.bindingProvider.getObservable(verticalPadding);
                thumbnailDescription.backgroundColor = this.bindingProvider.getObservable(backgroundColor);
                thumbnailDescription.wrapperHeight = thumbnailWrapperHeight;
                thumbnailDescription.scale = this.bindingProvider.getObservable((thumbnailHeight / pageDescriptions[i].h) / pointToPixelRatio);
                thumbLeftCoord = (thumbnailContainerWidth - thumbnailWidth) / 2;
                thumbnailDescription.thumbLeftCoord = this.bindingProvider.getObservable(thumbLeftCoord);

                if (this.useHtmlThumbnails) {
                    thumbnailDescription.htmlContent = pages[i].htmlContent;
                }

                notObservableThumbnails.push(thumbnailDescription);
            }
            this.thumbnails(notObservableThumbnails);
            this.loadThumbnails();
        },

        loadThumbnails: function () {
            var countToShow = Math.ceil(this.element.height() / parseInt(this._heightWidthRatio * 150)); // count of visible thumbs

            this._countToShowOnThumbDiv = countToShow;
            this._thumbsCountToShow = Number(countToShow) + Math.ceil(Number(Number(countToShow) / 2)); // count thumbs for show

            this.retrieveImageUrls(this.pageCount());
        },

        retrieveImageUrls: function (imageCount) {
            this._model.retrieveImageUrls(this._documentPath,
                    this._thumbnailWidth, 0, imageCount,
                    function (response) {
                        for (var i = 0; i < imageCount; i++) {
                            this.thumbnails()[i].url(response.data.image_urls[i]);
                        }
                        this._onScrollThumbnailsPanel();
                    }.bind(this),
                    function (error) {
                        for (var i = 0; i < imageCount; i++) {
                            this.makeThumbnailNotBusy(i);
                        }
                    }.bind(this)
            );
        },

        makeThumbnailNotBusy: function (thumbnailIndex) {
            var currentThumbnail = this.thumbnails()[thumbnailIndex];
            currentThumbnail.busy(false);
        },

        _onScrollThumbnailsPanel: function () {
            var pageCount = this.pageCount();
            var width = this._thumbnailWidth;
            var thumbContainer = this.element;
            var thumbnailHeight = thumbContainer.children("ul").children("li.thumb-page:first").outerHeight(false);

            var scrollTop = thumbContainer.scrollTop();
            var th = thumbContainer.height(); // thumbnails height
            var startIndex = Math.floor(scrollTop / thumbnailHeight);
            var endIndex = Math.floor((scrollTop + th) / thumbnailHeight) + 1;
            var end = (endIndex < pageCount - 2) ? endIndex + 2 : pageCount;

            for (var i = startIndex; i < end; i++) {
                if (this.useHtmlThumbnails) {
                    this.getDocumentPageHtmlCallback.call(this.viewerViewModel, i);
                }
                this.thumbnails()[i].visible(true);
            }
        },

        setThumbnailsScroll: function (data) {
            var index = data.pi;
            if (this.pageInd() != index) {
                this.pageInd(index);
                if (!data.eventAlreadyRaised)
                    this.element.trigger('onSetThumbnailsScroll', index);
            }

            var thumbnailsContainerTop = this.element.offset().top;

            var thumbWrapper = this.element.children("ul").children("li:nth-child(" + this.pageInd() + ")");
            if (thumbWrapper.length == 0)
                return;
            var thumbPageTop = thumbWrapper.offset().top;
            var divBottomPos = thumbPageTop - $(window).height();
            var divTopPos = thumbPageTop + thumbWrapper.height() - thumbnailsContainerTop;
            var leftScrollPos = this.element.scrollTop();
            var dif = thumbPageTop - thumbnailsContainerTop;
            if (divBottomPos > 0 || divTopPos < 0) {
                this.element.scrollTop(leftScrollPos + dif);
            }
        },

        set: function (index) {
            this.pageInd(index);
            $(this.element).trigger('onSetThumbnails', index);
        },

        setPageWithoutEvent: function (index) {
            this.pageInd(index);
        },

        setPagesCount: function (pagesCount) {
            this._pageCount = pagesCount;
            this.pageCount(pagesCount);
        }
    });
})(jQuery);