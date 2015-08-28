﻿(function ($, undefined) {
    $.groupdocsWidget('thumbnails', {
        _viewModel: null,
        _pageCount: 0,
        _documentPath: '',
        _heightWidthRatio: 0,
        _thumbnailWidth: 150,
        _portalService: Container.Resolve("PortalService"),
        options: {
            quality: null,
            use_pdf: "false",
            supportPageRotation: false,
            emptyImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        },

        _create: function () {
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
            this.bindingProvider.applyBindings(this._viewModel, this.thumbnailPanelElement);
        },

        _createViewModel: function () {
            var viewModel =
            {
                thumbnails: this.bindingProvider.getObservableArray([]),
                pageInd: this.bindingProvider.getObservable(1),
                pageCount: this.bindingProvider.getObservable(0),
                busy: this.bindingProvider.getObservable(true)
            };
            viewModel._thumbnailHeight = this.bindingProvider.getObservable(201);
            viewModel.useInnerThumbnails = this.options.useInnerThumbnails;
            viewModel.openThumbnails = this.bindingProvider.getObservable(this.options.openThumbnails);
            viewModel.element = this.element;
            viewModel.rootElement = this.rootElement;
            viewModel.thumbnailPanelElement = this.thumbnailPanelElement;
            viewModel.emptyImageUrl = this.emptyImageUrl;
            if (this.useHtmlThumbnails)
                viewModel.scale = this.bindingProvider.getObservable(0);

            viewModel.scrollThumbnailsPanel = function (e) {
                this._onScrollLeftPanel(e);
            }.bind(this);

            viewModel.selectPage = function (pageIndex) {
                this.set(pageIndex);
            }.bind(this);

            viewModel.showThumbnails = function (show) {
                var thumbnail;
                for (var i = 0; i < this.thumbnails().length; i++) {
                    thumbnail = this.thumbnails()[i];
                    thumbnail.visible(show);
                }
            };

            viewModel.hideThumbnails = function () {
                this.showThumbnails(false);
            };

            viewModel.onProcessPages = function (data, pages, getDocumentPageHtmlCallback, viewerViewModel, pointToPixelRatio, docViewerId) {
                this.onProcessPages(data, pages, getDocumentPageHtmlCallback, viewerViewModel, pointToPixelRatio, docViewerId);
            }.bind(this);

            viewModel.setThumbnailsScroll = function (data) {
                this.setThumbnailsScroll(data);
            }.bind(this);

            viewModel.set = function (index) {
                this.set(index);
            }.bind(this);

            viewModel.setPageWithoutEvent = function (index) {
                this.setPageWithoutEvent(index);
            }.bind(this);

            viewModel.getThumbnailsPanelWidth = function () {
                var thumbnailsPanelWidth = 0;
                if (this.useInnerThumbnails)
                    thumbnailsPanelWidth = this.element.parent().width();
                return thumbnailsPanelWidth;
            };

            viewModel.toggleThumbnails = function () {
                this.openThumbnails(!this.openThumbnails());
                this.rootElement.trigger("onResizeThumbnails", this.thumbnailPanelElement.width());
            };
            return viewModel;
        },

        getViewModel: function () {
            if (!this._viewModel) {
                this._viewModel = this._createViewModel();
            }
            return this._viewModel;
        },

        onProcessPages: function (data, pages, getDocumentPageHtmlCallback, viewerViewModel, pointToPixelRatio, docViewerId) {
            this._documentPath = data.path ? data.path : data.guid;
            this._viewModel.pageCount(data.pageCount);

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
                    this._viewModel.docViewerId = docViewerId;
                    var thumbnailContainerWidth = this.element.width();
                }
            }

            var notObservableThumbnails = [];
            var thumbnailDescription, verticalPadding, thumbnailWidth, thumbnailHeight, backgroundColor;
            var spinnerHeight = 47;
            var pageCount = this._viewModel.pageCount();
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
            this._viewModel.thumbnails(notObservableThumbnails);
            this.loadThumbnails();
        },

        loadThumbnails: function () {
            var countToShow = Math.ceil(this.element.height() / parseInt(this._heightWidthRatio * 150)); // count of visible thumbs

            this._countToShowOnThumbDiv = countToShow;
            this._thumbsCountToShow = Number(countToShow) + Math.ceil(Number(Number(countToShow) / 2)); // count thumbs for show

            this.retrieveImageUrls(this._viewModel.pageCount());
        },

        retrieveImageUrls: function (imageCount) {
            this._portalService.getImageUrlsAsync(this._documentPath,
                    this._thumbnailWidth.toString() + "x", 0, imageCount,
                    this.options.quality, this.options.use_pdf, null, null, null, null,
                    this.options.ignoreDocumentAbsence,
                    this.options.useHtmlBasedEngine, this.options.supportPageRotation,
                    this.options.instanceIdToken,
                    this.options.locale,
                    function (response) {
                        for (var i = 0; i < imageCount; i++) {
                            this._viewModel.thumbnails()[i].url(response.data.image_urls[i]);
                        }
                        this._onScrollLeftPanel();

                    }.bind(this),
                    function (error) {
                        for (var i = 0; i < imageCount; i++) {
                            this.makeThumbnailNotBusy(i);
                        }
                    }.bind(this)
            );
        },

        makeThumbnailNotBusy: function (thumbnailIndex) {
            var currentThumbnail = this._viewModel.thumbnails()[thumbnailIndex];
            currentThumbnail.busy(false);
        },

        _onScrollLeftPanel: function () {
            var pageCount = this._viewModel.pageCount();
            var width = this._thumbnailWidth;
            var thumbContainer = this.element;
            var thumbnailHeight = thumbContainer.find(".thumb-page:first").outerHeight(false); // div height

            var scrollTop = thumbContainer.scrollTop();
            var th = thumbContainer.height(); // thumbnails height
            var startIndex = Math.floor(scrollTop / thumbnailHeight);
            var endIndex = Math.floor((scrollTop + th) / thumbnailHeight) + 1;
            var end = (endIndex < pageCount - 2) ? endIndex + 2 : pageCount;

            for (var i = startIndex; i < end; i++) {
                if (this.useHtmlThumbnails) {
                    this.getDocumentPageHtmlCallback.call(this.viewerViewModel, i);
                }
                this._viewModel.thumbnails()[i].visible(true);
            }
        },

        setThumbnailsScroll: function (data) {
            var index = data.pi;
            if (this._viewModel.pageInd != index) {
                this._viewModel.pageInd(index);
                if (!data.eventAlreadyRaised)
                    this.element.trigger('onSetThumbnailsScroll', index);
            }

            var thumbnailsContainerTop = this.element.offset().top;

            var thumbWrapper = this.element.children("ul").children("li:nth-child(" + this._viewModel.pageInd() + ")");
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
            this._viewModel.pageInd(index);
            $(this.element).trigger('onSetThumbnails', index);
        },
        setPageWithoutEvent: function (index) {
            this._viewModel.pageInd(index);
        },
        setPagesCount: function (pagesCount) {
            this._pageCount = pagesCount;
            this._viewModel.pageCount(pagesCount);
        },

        _createHtml: function () {
            var result = this.bindingProvider.createHtml("thumbnails", this.element, this.options);
            this.element = result.element;
            this.thumbnailPanelElement = result.thumbnailPanelElement;
            this.toggleThumbnailsButton = result.toggleThumbnailsButton;
            this.rootElement = result.rootElement;
        }
    });
})(jQuery);