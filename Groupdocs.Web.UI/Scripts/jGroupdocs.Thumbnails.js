(function ($, undefined) {
    $.groupdocsWidget('thumbnails', {
        _viewModel: null,
        _pageCount: 0,
        _sessionToken: '',
        _docGuid: '',
        _docVersion: 1,
        _pagesWidth: '150',
        _heightWidthRatio: 0,
        _thumbsSelected: 0,
        _thumbnailWidth: 150,
        //_thumbnailHeight: 215,
        _portalService: Container.Resolve("PortalService"),
        options: {
            quality: null,
            use_pdf: "false",
            baseUrl: null,
            userId: 0,
            userKey: null,
            supportPageRotation: false
        },
        _create: function () {
            this.useHtmlThumbnails = this.options.useHtmlThumbnails;
            this.useHtmlBasedEngine = this.options.useHtmlBasedEngine;
            this.emptyImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
            if (this.options.supportPageReordering) {
                var self = this;
                ko.bindingHandlers.sortableArray = {
                    init: function (element, valueAccessor) {
                        var thumbnails = valueAccessor();
                        $(element).sortable({
                            axis: "y",
                            update: function (event, ui) {
                                var movedElement = ui.item[0];
                                //retrieve our actual data item
                                var dataItem = ko.dataFor(movedElement);
                                //var item = ui.item.tmplItem().data;
                                //figure out its new position
                                var oldPosition = thumbnails.indexOf(dataItem);
                                var newPosition = ko.utils.arrayIndexOf(ui.item.parent().children(), movedElement);
                                ui.item.remove();
                                //remove the item and add it back in the right spot
                                if (newPosition >= 0) {
                                    thumbnails.remove(dataItem);
                                    thumbnails.splice(newPosition, 0, dataItem);
                                }
                                self.rootElement.trigger("onPageReordered", [oldPosition, newPosition]);
                            }
                        });
                    }
                };
            }

            if (this.options.createHtml) {
                this._createHtml();
            }
            if (this.options.thumbnailWidth)
                this._thumbnailWidth = this.options.thumbnailWidth;

            this._viewModel = this.getViewModel();
            ko.applyBindings(this._viewModel, this.element.get(0));
            if (this.options.useInnerThumbnails)
                ko.applyBindings(this._viewModel, this.toggleThuumbnailsButton[0]);
        },

        _createViewModel: function () {
            var viewModel =
            {
                thumbnails: ko.observableArray([]),
                pageInd: ko.observable(1),
                pageCount: ko.observable(0),
                busy: ko.observable(true)
            };
            viewModel._thumbnailHeight = ko.observable(201);
            viewModel.useInnerThumbnails = this.options.useInnerThumbnails;
            viewModel.openThumbnails = ko.observable(this.options.openThumbnails);
            viewModel.element = this.element;
            viewModel.rootElement = this.rootElement;
            viewModel.thumbnailPanelElement = this.thumbnailPanelElement;
            viewModel.emptyImageUrl = this.emptyImageUrl;
            if (this.useHtmlThumbnails)
                viewModel.scale = ko.observable(0);

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
            this._sessionToken = data.token;
            this._docGuid = data.guid;
            this._docVersion = data.version;
            this._viewModel.pageCount(data.page_count);

            if (!data.lic && this._viewModel.pageCount() > 3)
                this._viewModel.pageCount(3);

            this._heightWidthRatio = parseFloat(data.page_size.Height / data.page_size.Width);
            var width = this._thumbnailWidth;
            var variablePageSizeSupport = false, pageDescriptions = null, maxPageHeight, widthForMaxHeight;
            var thumbnailWrapperHeight = null;
            var baseScale;
            if (data.documentDescription && data.documentDescription.pages) {
                variablePageSizeSupport = true;
                pageDescriptions = data.documentDescription.pages;
                maxPageHeight = data.documentDescription.maxPageHeight;
                widthForMaxHeight = data.documentDescription.widthForMaxHeight;
                thumbnailWrapperHeight = maxPageHeight / widthForMaxHeight * this._thumbnailWidth;
                baseScale = (thumbnailWrapperHeight / maxPageHeight) / pointToPixelRatio;
                if (this.useHtmlThumbnails) {
                    this.getDocumentPageHtmlCallback = getDocumentPageHtmlCallback;
                    this.viewerViewModel = viewerViewModel;
                    this._viewModel.docViewerId = docViewerId;
                    var thumbnailContainerWidth = this.element.width();
                    //this._viewModel.thumbLeftCoord = (thumbnailContainerWidth - width) / 2;
                }
            }

            //this._viewModel.thumbnails.removeAll();
            var notObservableThumbnails = [];
            var thumbnailDescription, verticalPadding, thumbnailWidth, thumbnailHeight, backgroundColor;
            var spinnerHeight = 47;
            var pageCount = this._viewModel.pageCount();
            var pageWidth, pageHeight, scaleRatio;
            var thumbLeftCoord;
            for (var i = 0; i < pageCount; i++) {
                thumbnailDescription = {
                    number: i + 1,
                    busy: ko.observable(true),
                    visible: ko.observable(false),
                    url: ko.observable(this.emptyImageUrl)
                };
                if (variablePageSizeSupport) {
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
                    thumbnailDescription.width = ko.observable(thumbnailWidth);
                    thumbnailDescription.height = ko.observable(thumbnailHeight);
                    verticalPadding = 0;
                    backgroundColor = "";
                    if (thumbnailHeight < spinnerHeight) {
                        verticalPadding = ((spinnerHeight - thumbnailHeight) / 2).toString();
                        backgroundColor = "white";
                    }
                    thumbnailDescription.verticalPadding = ko.observable(verticalPadding);
                    thumbnailDescription.backgroundColor = ko.observable(backgroundColor);
                    thumbnailDescription.wrapperHeight = thumbnailWrapperHeight;
                    //thumbnailDescription.scale = ko.observable(baseScale * pageDescriptions[i].h / maxPageHeight);
                    thumbnailDescription.scale = ko.observable((thumbnailHeight / pageDescriptions[i].h) / pointToPixelRatio);
                    thumbLeftCoord = (thumbnailContainerWidth - thumbnailWidth) / 2;
                    thumbnailDescription.thumbLeftCoord = ko.observable(thumbLeftCoord);

                    if (this.useHtmlThumbnails) {
                        thumbnailDescription.htmlContent = pages[i].htmlContent;
                    }
                }

                notObservableThumbnails.push(thumbnailDescription);
            }
            this._viewModel.thumbnails(notObservableThumbnails);
            var height = parseInt(this._heightWidthRatio * width);
            var thumbCss = "";
            if (variablePageSizeSupport) {
                //thumbCss = "div.thumbnailsContainer ul li img{background-color:white}";
            }
            else {
                thumbCss = ".grpdx .thumbnailsContainer .thumb-page{min-height:" + height.toString() + "px}";
            }

            this.loadThumbnails();
        },

        loadThumbnails: function () {
            // var countToShow = Math.ceil($('#thumbnails-container').height() / $('#thumb-1').height()); // count of visible thumbs
            var countToShow = Math.ceil(this.element.height() / parseInt(this._heightWidthRatio * 150)); // count of visible thumbs

            this._countToShowOnThumbDiv = countToShow;
            this._thumbsCountToShow = Number(countToShow) + Math.ceil(Number(Number(countToShow) / 2)); // count thumbs for show
            this._thumbsSelected = this._thumbsCountToShow; //_thumbsSelected = _thumbsCountToShow on start

            this.retrieveImageUrls(this._viewModel.pageCount());
        },

        retrieveImageUrls: function (imageCount) {
            this._portalService.getImageUrlsAsync(this.options.userId, this.options.userKey, this._docGuid,
                    this._thumbnailWidth.toString() + "x", this._sessionToken, 0, imageCount,
                    this.options.quality, this.options.use_pdf, this._docVersion, null, null, null, null,
                    this.options.ignoreDocumentAbsence,
                    this.options.useHtmlBasedEngine, this.options.supportPageRotation,
                    function (response) {
                        for (var i = 0; i < imageCount; i++) {
                            this._viewModel.thumbnails()[i].url(response.data.image_urls[i]);
                            //this.makeThumbnailNotBusy(i);
                        }
                        this._onScrollLeftPanel();

                    }.bind(this),
                    function (error) {
                        for (var i = 0; i < imageCount; i++) {
                            this.makeThumbnailNotBusy(i);
                        }
                    }.bind(this),
                this.options.instanceIdToken,
                this.options.locale
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

            this._thumbsSelected = endIndex;
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
            var root = this.element;
            var foreachOperator;

            if (this.options.supportPageReordering) {
                //foreachOperator = "sortable: {data: thumbnails, afterMove: function(arg){console.log('arg.sourceIndex:',arg.sourceIndex)}}";
                foreachOperator = "foreach: thumbnails, sortableArray: thumbnails";
            }
            else {
                foreachOperator = "foreach: thumbnails";
            }

            this.element = $(
'<div class="thumbnailsContainer" data-bind="event: { scroll: function(e) { scrollThumbnailsPanel(e); } }, visible:!useInnerThumbnails || openThumbnails">' +
'    <ul class="vertical-list2 ui-selectable" data-bind="' + foreachOperator + '">' +
'        <li class="thumb-page ui-selectee" data-bind="style: {height: $data.wrapperHeight + \'px\'}, css: { \'ui-selected\': ($index() + 1) == $root.pageInd() }, click: function() { $root.selectPage($index() + 1); }">' +
//'                <div class="thumbnail_wrapper" data-bind="style: {height: $data.height() + 2 * $data.verticalPadding() + \'px\'}">' +

(this.useHtmlThumbnails ?
(
'        <div class="thumbnail_wrapper" data-bind="style: {width:$data.width() + \'px\',height: $data.height() + 2 * $data.verticalPadding() + \'px\'}">' +
'           <div class="html_page_contents"' +
'                 data-bind="html: htmlContent, ' +
'                        visible: visible(),' +
'                        attr: {id: $root.docViewerId + \'pageHtml-\' + ($index() + 1) },' +
'                        style: { padding: $data.verticalPadding() + \'px 0\', ' +
'                                   MozTransform: \'scale(\' + $data.scale() + \')\', ' +
'                                    \'-webkit-transform\': \'scale(\' + $data.scale() + \')\',' +
'                                    \'-ms-transform\': \'scale(\' + $data.scale() + \')\' }">' +
'            </div>' +

'           <div class="html_page_contents mouse_intercept_overlay">' +
'            </div>'
)
:
(
'                <div class="thumbnail_wrapper" data-bind="style: {height: $data.height() + 2 * $data.verticalPadding() + \'px\'}">' +
'                    <img class="ui-selectee thumb_image" src="' + this.emptyImageUrl + '" data-bind="attr: {src: visible() ? url() : $root.emptyImageUrl}, style: {width: (visible() ? $data.width() : 0) + \'px\', height: (visible() ? $data.height() : 0) + \'px\', padding: $data.verticalPadding() + \'px 0\', backgroundColor: $data.backgroundColor()}" />'
)) +

'                </div>' +
'                <span class="progresspin thumb_progress"></span>' +
'        </li>' +
'    </ul>' +
'</div>');

            if (this.options.useInnerThumbnails) {
                this.thumbnailPanelElement = $('<div class="thumbnail_panel"></div>');
                this.element.appendTo(this.thumbnailPanelElement);
                this.toggleThuumbnailsButton = $('<div class="thumbnail_stripe">' +
                    '   <a class="thumbnail_open" data-bind="click:function(){toggleThumbnails();}"></a>' +
                    '</div>');
                this.toggleThuumbnailsButton.appendTo(this.thumbnailPanelElement);
                this.thumbnailPanelElement.prependTo(root);
            }
            else {
                this.element.appendTo(root);
            }
            this.rootElement = root;
        }

    });
})(jQuery);