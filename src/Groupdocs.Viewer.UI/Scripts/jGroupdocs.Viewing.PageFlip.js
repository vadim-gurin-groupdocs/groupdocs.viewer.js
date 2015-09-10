(function ($) {
    "use strict";

    $.groupdocsWidget('groupdocsDocumentImageRenderingPageFlip', {
        _viewModel: null,
        options: {
            fileId: 0,
            baseUrl: null,
            _docGuid: '',
            quality: null,
            use_pdf: "true"
        },

        _create: function () {
            $.extend(this.options, {
                emptyImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            });
            if (this.options.createHtml) {
                this._createHtml();
            }

            this.options.documentSpace = this.element;
            this._viewModel = this.getViewModel();
            ko.applyBindings(this._viewModel, this.element.get(0));
        },

        _init: function () {
            $(this._viewModel).bind('onPageTurned', function (e, pageIndex) {
                $(this.element).trigger('onPageTurned', [pageIndex]);
            } .bind(this));
        },

        getViewModel: function () {
            if (this._viewModel == null) {
                this._viewModel = this._createViewModel();
            }

            return this._viewModel;
        },

        _createViewModel: function () {
            var vm = new docViewerPageFlipViewModel(this.options);
            return vm;
        },

        applyBindings: function () {
            ko.applyBindings(this._viewModel, this.element.get(0));
        },


        _createHtml: function () {
            var viewerHtml =
'<div id="' + this.options.docViewerId + '_page_flip" class="doc_viewer_flip" data-bind="event: { scroll: function(item, e) { this.ScrollDocView(item, e); }, scrollstop: function(item, e) { this.ScrollDocViewEnd(item, e); } }">' +
'    <a class="page_prev" href="#" style="height: 100%" data-bind="click: previousBroadside"></a>' +
'    <a class="page_next" href="#" style="height: 100%" data-bind="click: nextBroadside"></a>' +

'    <div class="bookCovers" style="display: none">' +
'        <div class="hard hard_ie9 page">' +
'            <a class="page_next2 first_page_link" href="#">' +
'                <h1 class="ellipses" data-bind="text: documentName(), ellipsis: true" style="max-width: 700px;"></h1>' +
'            </a>' +
'        </div>' +
'        <div class="hard hard_ie9 page"></div>' +
'    </div>' +

'    <div style="overflow: hidden;">' +
'        <div class="pages_container_flip sample-docs">' +
'            <!-- ko foreach: pages -->' +
'                <div class="doc-page" data-bind="attr: {id: $root.pagePrefix + number}, style: { width: $root.pageWidth() + \'px\', height: $root.pageHeight() + \'px\' }">' +
'                     <div>' +
'                        <div class="button-pane"></div>' +
'                        <div class="highlight-pane"></div>' +
'                        <div class="custom-pane"></div>' +
'                        <div class="search-pane"></div>' +
'                        <img class="page-image page_image_flip" src="' + this.options.emptyImageUrl + '" data-bind="attr: { id: $root.docViewerId +  \'_page_flip-img-\' + number, src: (visible() ? url : $root.emptyImageUrl) }, ' +
'                                                                        style: { width: $root.pageWidth() + \'px\', height: $root.pageHeight() + \'px\' }"/>' +
'                    </div>' +
'                </div>' +
'            <!-- /ko -->' +
'        </div>' +
'    </div>' +
'</div>';

            var root = this.element;
            this.element = $(viewerHtml).appendTo(root);
            root.trigger("onHtmlCreated");
        }
    });

    // Doc Viewer Model
    var docViewerPageFlipModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(docViewerPageFlipModel.prototype, {
        _init: function () {
            this._portalService = Container.Resolve("ServerExchange");
        },

        retrieveImageUrls: function (fileId, imageCount, pagesDimension, token, callback, errorCallback) {
            this._portalService.getImageUrlsAsync(fileId, pagesDimension, 0, imageCount, this.quality == null ? '' : this.quality, this.use_pdf,
                function (response) {
                    callback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        }
    });

    // Doc Viewer View Model
    window.docViewerPageFlipViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };
    $.extend(window.docViewerPageFlipViewModel.prototype, {
        _model: null,
        pagesDimension: null,
        pageImageWidth: 568.0,
        imageHorizontalMargin: 34,
        initialZoom: 100,
        zoom: null,
        scale: null,
        docWasLoadedInViewer: false,
        scrollPosition: [0, 0],
        inprogress: null,
        pages: null,
        pageInd: null,
        pageWidth: null,
        pageHeight: null,
        pageCount: null,
        docType: null,
        fileId: null,
        _dvselectable: null,
        _thumbnailHeight: 140,
        _firstPage: null,
        imageUrls: [],
        pagePrefix: "page-flip-",
        documentName: null,
        fit90PercentWidth: false,
        _pageBounds: null,
        changedUrlHash: false,
        bookWidth: 0,
        pagingBarWidth: 30,
        turnPageWithoutEvent: false,
        minimumImageWidth: null,

        _create: function (options) {
            this._model = new docViewerPageFlipModel(options);

            this._init(options);
        },

        _init: function (options) {
            this.pages = ko.observableArray([]);
            this.scale = ko.observable(this.initialZoom / 100);
            this.zoom = ko.observable(this.initialZoom);
            this.inprogress = ko.observable(false),
            this.pageLeft = ko.observable(0);
            this.pageInd = ko.observable(1);
            this.pageWidth = ko.observable(0);
            this.pageHeight = ko.observable(0);
            this.pageCount = ko.observable(0);
            this.docType = ko.observable(-1);
            this.documentName = ko.observable("");

            if (!this.docViewerId)
                this.docViewerId = this.documentSpace.attr('id');
            this.pagePrefix = this.docViewerId + "-page-flip-";

            this.pagesDimension = Math.floor(this.pageImageWidth).toString() + "x";
            if (this.pages().length == 0)
                this.pages.push({ number: 1, visible: ko.observable(false), url: ko.observable(this.emptyImageUrl) });
        },

        retrieveImageUrls: function (imageCount) {
            var i;
            var pageDimension, pageWidth;
            if (this.shouldMinimumWidthBeUsed(this.pageWidth(), true))
                pageWidth = this.minimumImageWidth;
            else
                pageWidth = this.pageWidth();

            pageDimension = Math.floor(pageWidth) + "x";
            this._model.retrieveImageUrls(this.fileId, imageCount, pageDimension, this.token,
            function (response) {
                var newPageIndex;
                for (i = 0; i < imageCount; i++) {
                    this.pages()[i].url(response.image_urls[i]);
                    newPageIndex = i + 1;
                    var pageImageElement = this.setImageElementSize(newPageIndex, this.pageWidth(), this.pageHeight());
                    pageImageElement.attr("src", this.pages()[newPageIndex - 1].url());
                }
                this.loadImagesForVisiblePages();
            } .bind(this),
            function (error) {
                this._onError(error);
            } .bind(this));
        },

        _onError: function (error) {
            this.inprogress(false);
            jerror(error.Reason || "The document couldn't be loaded...");
        },

        _onDocumentLoaded: function (response, pdf2XmlWrapper) {
            this.fileId = response.guid;
            this.docGuid = response.guid;
            this.documentName(response.name);
            this.docType(response.doc_type);
            this.pageCount(response.page_count);
            this.token = response.token;

            var pageSize = null;
            this._pdf2XmlWrapper = pdf2XmlWrapper;
            pageSize = this._pdf2XmlWrapper.getPageSize();

            this.pagesContainerElement = this.documentSpace.find("div.pages_container_flip");
            this.heightWidthRatio = parseFloat(pageSize.height / pageSize.width);
            var viewerWidth;
            if (this.viewerWidth)
                viewerWidth = this.viewerWidth;
            else
                viewerWidth = this.documentSpace.parent().width();

            this.pageWidth((viewerWidth - this.pagingBarWidth * 2) / 2);
            this.pageHeight(Math.round(this.pageWidth() * this.heightWidthRatio));

            if (this._dvselectable) {
                var selectable = this._dvselectable.data("groupdocsSelectable");
                selectable.destroy();
            }

            if (this.pagesContainerElement.turn("is"))
                this.pagesContainerElement.turn("destroy");
            this.pagesContainerElement.height(this.pageHeight());

            this.inprogress(false);

            var pageCount = this.pageCount();
            var i;

            var pagesNotObservable = [];
            for (i = 1; i <= pageCount; i++)
                pagesNotObservable.push({ number: i, visible: ko.observable(false), url: ko.observable(this.emptyImageUrl) });
            this.pages(pagesNotObservable);

            this._firstPage = this.pagesContainerElement.find("#" + this.pagePrefix + "1");

            for (i = 0; i < response.image_urls.length && i < this.pages().length; i++) {
                this.pages()[i].url(response.image_urls[i]);
            }

            if (!this.zoomToFitHeight)
                this.loadImagesForVisiblePages();

            this.initialWidth = this.pageWidth();
            if (pageSize != null)
                this.scale(this.initialWidth / pageSize.width);

            var hCount = Math.floor(this.pagesContainerElement.width() / this._firstPage.width());
            if (hCount == 0)
                hCount = 1;

            this._dvselectable = this.pagesContainerElement.groupdocsSelectable({
                txtarea: this.selectionContent,
                pdf2XmlWrapper: this._pdf2XmlWrapper,
                startNumbers: this.getVisiblePagesNumbers(),
                pagesCount: this.pageCount(),
                proportion: this.scale(),
                disabled: this.use_pdf == "true" ? false : true,
                pageHeight: this.getPageHeight(),
                horizontalPageCount: hCount,
                docSpace: this.documentSpace,
                bookLayout: true,
                pagePrefix: this.pagePrefix
            });

            this._dvselectable.groupdocsSelectable("setVisiblePagesNumbers", this.getVisiblePagesNumbers());

            this.docWasLoadedInViewer = true;

            this.documentSpace.find("div.bookCovers > div:first").clone().prependTo(this.pagesContainerElement); //.height(this.pageHeight());
            this.documentSpace.find("div.bookCovers > div:last").clone().appendTo(this.pagesContainerElement); //.height(this.pageHeight());

            this.setPage(1, true, true);

            var self = this;

            this.pagesContainerElement.turn({
                elevation: 50,
                acceleration: true,
                gradients: true,
                autoCenter: true,
                duration: 1000,
                width: viewerWidth - this.pagingBarWidth * 2,
                height: this.pageHeight()
            });

            this.pagesContainerElement.bind("turning", function (event, page, view) {
                var book = $(this);
                var pages = book.turn('pages');

                if (page > pages) {
                    event.preventDefault();
                    return;
                }
                page = page - 1; // 1 for cover

                self.setImageElementSize(page - 1, self.pageWidth(), self.pageHeight());
                self.setPage(page - 1, true);
                self.setImageElementSize(page, self.pageWidth(), self.pageHeight());
                self.setPage(page, true, true);
                self.setImageElementSize(page + 1, self.pageWidth(), self.pageHeight());
                self.setPage(page + 1, true); // lazy load in advance
                self.setImageElementSize(page + 2, self.pageWidth(), self.pageHeight());
                self.setPage(page + 2, true);
            });

            this.pagesContainerElement.bind("turned", function (event, page, view) {
                page = page - 1; // 1 for cover

                self.setImageElementSize(page - 1, self.pageWidth(), self.pageHeight());
                self.setPage(page - 1, true);
                self.setImageElementSize(page, self.pageWidth(), self.pageHeight());
                self.setPage(page, true);
                self.setImageElementSize(page + 1, self.pageWidth(), self.pageHeight());
                self.setPage(page + 1, true); // load in advance
                self.setImageElementSize(page + 2, self.pageWidth(), self.pageHeight());
                self.setPage(page + 2, true);

                if (self._dvselectable) {
                    var visiblePagesNumbers = self.getVisiblePagesNumbers();
                    var pagesOnScreen = 2;
                    if (page == pageCount)
                        pagesOnScreen = 1;

                    self._dvselectable.groupdocsSelectable("reInitPages", self.scale(), visiblePagesNumbers, self.scrollPosition, self.getPageHeight(), pagesOnScreen);
                }
                var book = $(this);
                book.turn('center');
                if (!self.turnPageWithoutEvent && page > 0 && page <= pageCount)
                    $(this).trigger('onPageTurned', page);
                self.turnPageWithoutEvent = false;
            });
            
            this.documentSpace.width(this.pagesContainerElement.width());
            if (this.zoomToFitHeight)
                this.setZoom(this.getFitHeightZoom());

        },

        getFitWidthZoom: function () {
            var viewerWidth;
            if (this.viewerWidth)
                viewerWidth = this.viewerWidth;
            else
                viewerWidth = this.documentSpace.parent().width();
            return viewerWidth / ((this.initialWidth + this.pagingBarWidth) * 2) * 100;
        },

        getFitHeightZoom: function () {
            var viewerHeight;
            if (this.viewerHeight)
                viewerHeight = this.viewerHeight;
            else
                viewerHeight = this.documentSpace.parent().height();
            return viewerHeight / Math.round(this.initialWidth * this.heightWidthRatio) * 100;
        },

        getPageHeight: function () {
            return this.unscaledPageHeight * this.scale();
        },

        getSelectable: function () {
            return this._dvselectable;
        },

        getVisiblePagesNumbers: function () {
            var start;
            var end;
            var currentPage = this.pageInd();
            if (currentPage % 2 == 1) {
                start = currentPage;
                end = currentPage + 1;
            }
            else {
                start = currentPage - 1;
                end = currentPage;
            }
            var pageCount = this.pageCount();
            if (end > pageCount)
                end = pageCount;
            return { start: start, end: end };
        },

        loadImagesForVisiblePages: function () {
            var numbers = this.getVisiblePagesNumbers();
            var start = numbers.start;
            var end = numbers.end;
            for (var i = start; i <= end; i++) {
                this.pages()[i - 1].visible(true);
            }
            return numbers;
        },

        setPage: function (index, setInternalPageOnly, raiseEvent) {
            var pageCount = this.pageCount();
            var newPageIndex = Number(index);
            
            if (newPageIndex > pageCount)
                newPageIndex = pageCount;
            if (isNaN(newPageIndex) || newPageIndex < 1)
                newPageIndex = 1;

            var direction;
            if (this.pageInd() < newPageIndex) {
                direction = 'up';
            }
            else {
                direction = 'down';
            }

            this.pages()[newPageIndex - 1].visible(true);
            var pageImageElement = this.pagesContainerElement.find("#" + this.pagePrefix + newPageIndex.toString() + " img.page-image");
            var imageUrl = this.pages()[newPageIndex - 1].url();
            if (pageImageElement.attr("src") != imageUrl)
                pageImageElement.attr("src", imageUrl);
            if (!setInternalPageOnly && this.documentSpace.is(":visible")) {
                this.turnPageWithoutEvent = true;
                this.pagesContainerElement.turn("page", newPageIndex + 1);
            }
            if (raiseEvent) {
                this.pageInd(newPageIndex);
            }
        },

        setImageElementSize: function (pageIndex, width, height) {
            var pageImageElement = this.pagesContainerElement.find("#" + this.pagePrefix + pageIndex.toString() + " img.page-image");
            if (pageImageElement.width() != width)
                pageImageElement.width(width);
            if (pageImageElement.height() != height)
                pageImageElement.height(height);
            return pageImageElement;
        },

        previousBroadside: function () {
            var currentPageIncludingCover = this.pagesContainerElement.turn("page");
            var currentPageNotIncludingCover = currentPageIncludingCover - 1;
            var pageCount = this.pageCount();
            var newPage;
            if (currentPageNotIncludingCover == 0 || currentPageNotIncludingCover > pageCount)
                newPage = currentPageNotIncludingCover - 2;
            else
                newPage = this.pageInd() - 2;
            if (newPage < 1)
                newPage = 1;
            this.setPage(newPage, true);
            this.turnPageWithoutEvent = true;
            this.pagesContainerElement.turn('previous');
            this.pageInd(newPage);
            if (newPage > 0 && newPage <= pageCount)
                $(this).trigger('onPageTurned', newPage);
        },

        nextBroadside: function () {
            var currentPageIncludingCover = this.pagesContainerElement.turn("page");
            var currentPageNotIncludingCover = currentPageIncludingCover - 1;
            var pageCount = this.pageCount();
            var newPage;
            if (currentPageNotIncludingCover == 0 || currentPageNotIncludingCover > pageCount)
                newPage = currentPageNotIncludingCover + 2;
            else
                newPage = this.pageInd() + 2;
            if (newPage > pageCount)
                newPage = pageCount;
            this.setPage(newPage, true);
            this.turnPageWithoutEvent = true;
            this.pagesContainerElement.turn('next');
            this.pageInd(newPage);
            if (newPage > 0 && newPage <= pageCount)
                $(this).trigger('onPageTurned', newPage);
        },

        setZoom: function (value) {
            this.zoom(value);

            if (this.isPageFlipViewerVisible()) {
                this.loadPagesZoomed();

                if (this._pdf2XmlWrapper) {
                    var pageSize = this._pdf2XmlWrapper.getPageSize();
                    this.scale(this.initialWidth / pageSize.width * value / 100);
                }

                this.pagesContainerElement.width(this.pageWidth() * 2);
                this.pagesContainerElement.height(this.pageHeight());
                this.documentSpace.width(this.pageWidth() * 2);
                this.pagesContainerElement.turn("size", this.pagesContainerElement.width(), this.pagesContainerElement.height());
                var pageImages = this.pagesContainerElement.find("img.page_image_flip");
                pageImages.width(this.pageWidth());
                pageImages.height(this.pageHeight());
                this.resizeViewerElement(this.viewerLeft);
                this._dvselectable.groupdocsSelectable("changeSelectedRowsStyle", this.scale());
                var visiblePagesNumbers = this.getVisiblePagesNumbers();

                var hCount = Math.floor(this.pagesContainerElement.width() / this._firstPage.width());
                if (hCount == 0)
                    hCount = 1;

                this._dvselectable.groupdocsSelectable("reInitPages", this.scale(), visiblePagesNumbers, this.scrollPosition, this.pageWidth() * this.heightWidthRatio, hCount);
            }
        },

        loadPagesZoomed: function () {
            var newWidth = (this.initialWidth * this.zoom() / 100) >> 0;
            var newHeight = (newWidth * this.heightWidthRatio) >> 0;
            this.pagesDimension = newWidth + 'x';

            this.pageWidth(newWidth);
            this.pageHeight(newHeight);

            var pageCount = this.pageCount();
            this.setPage(this.pageInd());
            if (!this.shouldMinimumWidthBeUsed(newWidth, true))
                this.retrieveImageUrls(pageCount);
        },

        reInitSelectable: function () {
            var visiblePagesNumbers = this.getVisiblePagesNumbers();
            if (this._dvselectable != null) {
                this._dvselectable.groupdocsSelectable("reInitPages", this.scale(), visiblePagesNumbers,
                    this.scrollPosition, this.getPageHeight());
            }
        },

        onDocumentPageSet: function (newPageIndex) {
            this.pageInd(newPageIndex);
            if (this.isPageFlipViewerVisible())
                this.openCurrentPage();
        },

        openCurrentPage: function () {
            if (this.pagesContainerElement)
                this.setPage(this.pageInd());
        },

        isPageFlipViewerVisible: function () {
            var isVisible = this.documentSpace.is(":visible");
            return isVisible;
        },

        shouldMinimumWidthBeUsed: function (width, checkOriginalDocumentWidth) {
            var originalDocumentWidth = null;
            if (this.use_pdf != 'false' && checkOriginalDocumentWidth) {
                var pageSize = this._pdf2XmlWrapper.getPageSize();
                originalDocumentWidth = pageSize.width;
            }
            return this.minimumImageWidth != null &&
                (width <= this.minimumImageWidth || (originalDocumentWidth !== null && originalDocumentWidth < this.minimumImageWidth));
        },

        resizeViewerElement: function (viewerLeft) {
            var parent = this.documentSpace.parent();
            var viewerMainWrapper = parent.parent();
            var viewerMainWrapperWidth = viewerMainWrapper.width();
            if (typeof viewerLeft == "undefined")
                viewerLeft = 0;
            else
                this.viewerLeft = viewerLeft;
            parent.width(viewerMainWrapperWidth - viewerLeft);
            this.reInitSelectable();
            this.loadImagesForVisiblePages();
        }
    });
})(jQuery);