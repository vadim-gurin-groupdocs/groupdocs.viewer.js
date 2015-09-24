(function ($, undefined) {
    "use strict";

    $.groupdocsWidget("groupdocsDocumentImageRendering", {
        _viewModel: null,
        options: {
            fileId: 0,
            quality: null,
            supportTextSelection: true,
            showHyperlinks: true
        },

        _create: function () {
            $.extend(this.options, {
                documentSpace: this.element,
                emptyImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            });
            this.bindingProvider = new window.groupdocs.bindingProvider();
            this.options.bindingProvider = this.bindingProvider;

            if (this.options.createHtml) {
                this._createHtml();
            }
            this._viewModel = this.getViewModel();
            this.bindingProvider.applyBindings(this._viewModel, this.element);
        },

        _init: function () {
        },

        getViewModel: function () {
            if (this._viewModel == null) {
                this._viewModel = this._createViewModel();
            }

            return this._viewModel;
        },

        _createViewModel: function () {
            var vm = new window.groupdocs.documentImageRenderingComponentViewModel(this.options);
            return vm;
        },

        _createHtml: function () {
            var root = this.element;
            this.bindingProvider.createHtml("viewing", this.element, this.options);
            root.trigger("onHtmlCreated");
        }
    });

    window.groupdocs.documentImageRenderingComponentModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(window.groupdocs.documentImageRenderingComponentModel.prototype, window.groupdocs.documentComponentModel.prototype, {
        _init: function () {
            this._portalService = Container.Resolve("ServerExchange");
        },

        loadDocument: function (fileId, pagesCountToShow, imageWidth, password, fileDisplayName,
                                watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                ignoreDocumentAbsence,
                                supportPageRotation,
                                supportListOfContentControls, supportListOfBookmarks,
                                instanceIdToken,
                                locale,
                                callback, errorCallback) {
            var onSucceded = function (response) {
                if (response.data != null) {
                    callback.apply(this, [response.data]);
                }
                else {
                    errorCallback.apply(this, [{ code: response.data.code, Reason: (response.data ? response.data.Reason : null) }]);
                }
            };

            this._portalService.viewDocument(fileId, imageWidth, this.quality, this.supportTextSelection, this.preloadPagesCount, password, fileDisplayName,
                watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                ignoreDocumentAbsence, supportPageRotation,
                supportListOfContentControls, supportListOfBookmarks,
                instanceIdToken,
                locale,
                onSucceded, errorCallback);
        },

        loadHyperlinks: function (fileId, callback, errorCallback) {
            this._portalService.getDocumentHyperlinks(fileId,
                function (response) {
                    callback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        retrieveImageUrls: function (fileId, imageCount, pagesDimension,
                                         watermarkText, watermarkColor,
                                         watermarkPosition, watermarkWidth,
                                         ignoreDocumentAbsence,
                                         useHtmlBasedEngine,
                                         supportPageRotation,
                                         instanceIdToken,
                                         locale,
                                         callback, errorCallback) {
            this._portalService.getImageUrlsAsync(fileId, pagesDimension, 0, imageCount, this.quality == null ? '' : this.quality, this.supportTextSelection,
                                              watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                              ignoreDocumentAbsence,
                                              useHtmlBasedEngine, supportPageRotation,
                                              instanceIdToken,
                                              locale,
            function (response) {
                callback.apply(this, [response.data]);
            },
            function (error) {
                errorCallback.apply(this, [error]);
            });
        }
    });

    window.groupdocs.documentImageRenderingComponentViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(window.groupdocs.documentImageRenderingComponentViewModel.prototype, window.groupdocs.documentComponentViewModel.prototype, {
        options: {
            showHyperlinks: true
        },

        _create: function (options) {
            this._model = new window.groupdocs.documentImageRenderingComponentModel(options);
            this._init(options);
        },

        _init: function (options) {
            this.initialWidth = this.defaultPageImageWidth;
            window.groupdocs.documentComponentViewModel.prototype._init.call(this, options);
        },

        loadDocument: function (fileId) {
            window.groupdocs.documentComponentViewModel.prototype.loadDocument.call(this, fileId);
            
            var pageCountToShow = 1;
            var pageWidth;
            if (this.shouldFullSizeImagesBeUsed())
                pageWidth = null;
            else
                pageWidth = Math.round(this.pageImageWidth * this.initialZoom / 100);

            this._model.loadDocument(fileId || this.fileId, pageCountToShow, pageWidth, this.password(), this.fileDisplayName,
                this.watermarkText, this.watermarkColor, this.watermarkPosition, this.watermarkWidth,
                this.ignoreDocumentAbsence, this.supportPageRotation,
                this.supportListOfContentControls, this.supportListOfBookmarks,
                this.instanceIdToken,
                this.locale,
                function (response) {
                    if (typeof (fileId) !== 'undefined')
                        this.fileId = fileId;
                    this.pageWidth(this.pageImageWidth * (this.initialZoom / 100));
                    this.zoom(this.initialZoom);
                    this._onDocumentLoadedBeforePdf2Xml(response);
                }.bind(this),
                function (error) {
                    this._onDocumentLoadFailed(error);
                }.bind(this));
        },

        retrieveImageUrls: function (imageCount) {
            var i;
            var pageDimension, pageWidth;
            if (this.shouldFullSizeImagesBeUsed())
                pageWidth = null;
            else
                pageWidth = this.pageWidth();

            pageDimension = Math.floor(pageWidth);

            this._model.retrieveImageUrls(this.fileId, imageCount, pageDimension,
                this.watermarkText, this.watermarkColor, this.watermarkPosition, this.watermarkWidth,
                this.ignoreDocumentAbsence,
                this.useHtmlBasedEngine, this.supportPageRotation,
                this.instanceIdToken,
                this.locale,
                function (response) {
                    for (i = 0; i < imageCount; i++) {
                        this.pages()[i].url(response.image_urls[i]);
                        this.loadImagesForVisiblePages();
                    }
                }.bind(this),
                function (error) {
                    this._onError(error);
                }.bind(this));
        },

        
        initPagesAfterDocumentLoad: function (response) {
            var pageSize = this._pdf2XmlWrapper.getPageSize();

            this.scale(this.pageImageWidth * (this.initialZoom / 100) / pageSize.width);
            this.unscaledPageWidth = Number(pageSize.width);
            this.unscaledPageHeight = Number(pageSize.height);

            this.heightWidthRatio = parseFloat(pageSize.height / pageSize.width);
            this.pageHeight(Math.round(this.pageImageWidth * this.heightWidthRatio * (this.initialZoom / 100)));

            this.triggerEvent('_onProcessPages', [response, this, this.makePageVisible]);

            var pageCount = this.pageCount();
            var pagesNotObservable = [];
            var pageDescription;

            var pages;
            this.serverPages = pages = this._pdf2XmlWrapper.documentDescription.pages;

            //this.pages.removeAll();
            var pageImageUrl, pageDescriptionCount;
            pageDescriptionCount = this._pdf2XmlWrapper.getPageCount();

            var rotationFromServer, i;
            for (i = 0; i < pageCount; i++) {
                if (i < response.imageUrls.length)
                    pageImageUrl = response.imageUrls[i];
                else
                    pageImageUrl = "";

                pageDescription = {
                    number: i + 1,
                    visible: this.bindingProvider.getObservable(false),
                    url: this.bindingProvider.getObservable(pageImageUrl)
                };
                if (i < pageDescriptionCount && pages)
                    pageDescription.prop = this.bindingProvider.getObservable(pages[i].h / pages[i].w);
                else
                    pageDescription.prop = this.bindingProvider.getObservable(this.bindingProvider.getValue(this.pageHeight) / this.bindingProvider.getValue(this.pageWidth));

                if (this.supportPageRotation) {
                    rotationFromServer = this.serverPages[i].rotation;
                    if (typeof rotationFromServer == "undefined")
                        rotationFromServer = 0;
                    pageDescription.rotation = this.bindingProvider.getObservable(rotationFromServer);
                    this.applyPageRotationInBrowser(i, pageDescription, rotationFromServer);
                }
                pageDescription.left = 0;
                pageDescription.top = this.getPageTop(0);

                pagesNotObservable.push(pageDescription);
            }
            return pagesNotObservable;
        },

        _onDocumentHyperlinksLoaded: function (response) {
            if (!response || !response.links) {
                this.hyperlinks.removeAll();
                return;
            }

            var links = [];
            var self = this;
            var selectable = this.getSelectableInstance();

            $.each(response.links, function () {
                var l = {
                    url: this.Url,
                    pageNumber: this.PageNumber,
                    targetPage: this.TargetPage,
                    rect: new groupdocs.Rect(this.Bounds.X, this.Bounds.Y, this.Bounds.X + this.Bounds.Width, this.Bounds.Y + this.Bounds.Height)
                };
                l.frame = this.bindingProvider.getObservable(selectable != null ? selectable.convertPageAndRectToScreenCoordinates(l.pageNumber, l.rect) : l.rect);
                links.push(l);
            });

            this.hyperlinks(links);
        },

        _loadHyperlinks: function () {
            if (this.options.showHyperlinks == true) {
                this._model.loadHyperlinks(
                    this.fileId,
                    this._onDocumentHyperlinksLoaded.bind(this),
                    function (error) {
                    });
            }
        },

        _refreshHyperlinkFrames: function () {
            var selectable = this.getSelectableInstance();

            $.each(this.hyperlinks(), function () {
                this.frame(selectable != null ? selectable.convertPageAndRectToScreenCoordinates(this.pageNumber, this.rect) : this.rect);
            });
        },

        loadImageForPage: function (number, page, forceLoading) {
            if (this.supportPageRotation && forceLoading) {
                this.addSuffixToImageUrl(page);
            }
        },

        makePageVisible: function (pageNumber, page) {
            if (!page) {
                var pages = this.pages();
                if (pageNumber < pages.length)
                    page = pages[pageNumber];
            }

            if (page)
                page.visible(true);
        },

        setZoom: function (value) {
            window.groupdocs.documentComponentViewModel.prototype.setZoom.call(this, value);

            if (this._pdf2XmlWrapper) {
                var pageSize = this._pdf2XmlWrapper.getPageSize();
                this.scale(this.pageImageWidth / pageSize.width * value / 100);
            }

            var selectable = this.getSelectableInstance();
            selectable.changeSelectedRowsStyle(this.scale());
            this.reInitSelectable();
            if (this.useVirtualScrolling) {
                selectable.recalculateSearchPositions(this.scale());
                this.highlightSearch();
            }
            this.setPage(this.pageIndex());

            if (this.shouldFullSizeImagesBeUsed())
                this.loadImagesForVisiblePages();

            if (this.options.showHyperlinks) {
                this._refreshHyperlinkFrames();
            }
        },

        loadPagesZoomed: function () {
            var newWidth = window.groupdocs.documentComponentViewModel.prototype.loadPagesZoomed.call(this);
            if (newWidth !== null) {
                this.calculatePagePositions();
                var pageCount = this.pageCount();
                if (!this.shouldFullSizeImagesBeUsed())
                    this.retrieveImageUrls(pageCount);
            }
        },

        performSearch: function (value, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch) {
            var selectable = this.getSelectableInstance();
            if (selectable != null) {
                selectable.performSearch(value, this.scale(), isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch);
            }
        },

        shouldFullSizeImagesBeUsed: function () {
            return this.useFullSizeImages;
        },

        refreshPageContents: function (page) {
            page.visible(false);
            this.addSuffixToImageUrl(page);
            page.visible(true);
        },

        adjustInitialZoom: function () {
            window.groupdocs.documentComponentViewModel.prototype.adjustInitialZoom.call(this);
        },

        addSuffixToImageUrl: function (page) {
            var src = page.url();
            var prefixChar = "?";
            var dummyIndex = src.indexOf('dummy=');
            if (dummyIndex != -1) {
                src = src.substring(0, dummyIndex - 1);
            }

            var paramsIndex = src.indexOf('?');
            if (paramsIndex != -1)
                prefixChar = "&";
            page.url(src + prefixChar + 'dummy=' + new Date().getTime());
        },

        firePageImageLoadedEvent: function (pageNumber, event) {
            var domElement = event.target;
            if (this.useFullSizeImages) {
                var pages = this.pages();
                var page = null;
                if (pageNumber < pages.length)
                    page = pages[pageNumber];

                if (page)
                    page.domElement = domElement;

                this.triggerEvent("pageImageLoaded.groupdocs", [pageNumber, domElement]);
            }
        },

        getPageDomElement: function (pageNumber) {
            if (this.useFullSizeImages) {
                var pages = this.pages();
                var page = null;
                if (pageNumber < pages.length)
                    page = pages[pageNumber];

                if (page)
                    return page.domElement;
            }
            return null;
        }
    });
})(jQuery);