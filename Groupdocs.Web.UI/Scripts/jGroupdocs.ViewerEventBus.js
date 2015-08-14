groupdocs.ViewerEventBus = function (options) {
    $.extend(this, options);
    this.init();
};
$.extend(groupdocs.ViewerEventBus.prototype, {
    docViewerWidget: null,
    docViewerViewModel: null,
    navigationWidget: null,
    navigationViewModel: null,
    thumbnailsWidget: null,
    thumbnailsViewModel: null,
    zoomViewModel: null,

    init: function () {
        this.docSpacePageFlip = null;

        var docViewer = null;
        var navigation = null;
        var thumbnails = null;
        var zooming = null;
        var search = null;
        var embedSource = null;
        var viewTypeMenu = null;

        var docViewerViewModel = null;
        var navigationViewModel = null;
        var thumbnailsViewModel = null;
        var zoomViewModel = null;
        var searchViewModel = null;
        var embedSourceViewModel = null;
        var viewTypeViewModel = null;

        var menuClickedEvent = "onMenuClicked";

        if (this.thumbnails) {
            thumbnails = this.thumbnails.thumbnails(this.thumbnailsOptions || { baseUrl: this.baseUrl,
                quality: this.quality,
                use_pdf: this.use_pdf
            });
            thumbnailsViewModel = this.thumbnails.thumbnails('getViewModel');
        }
        else {
            thumbnails = this.thumbnailsCreator();
            thumbnailsViewModel = this.thumbnailsViewModelCreator();
        }

        var thumbnailsPanelWidth = 0;
        if (this.thumbnails)
            thumbnailsPanelWidth = thumbnailsViewModel.getThumbnailsPanelWidth();

        if (this.docSpace) {
            var viewerOptions = $.extend(
            {
                userId: this.userId,
                userKey: this.userKey,
                baseUrl: this.baseUrl,
                fileId: this.fileId,
                fileVersion: this.fileVersion,
                quality: this.quality,
                use_pdf: this.use_pdf,
                pageImageWidth: this.pageImageWidth,
                _mode: this._mode,
                docViewerId: this.docViewerId,
                createHtml: this.createHtml,
                initialZoom: this.initialZoom,
                alwaysOnePageInRow: this.alwaysOnePageInRow,
                zoomToFitWidth: this.zoomToFitWidth,
                zoomToFitHeight: this.zoomToFitHeight,
                viewerLeft: thumbnailsPanelWidth,
                viewerWidth: this.viewerWidth,
                viewerHeight: this.viewerHeight,
                preloadPagesCount: this.preloadPagesCount,
                selectionContent: this.selectionContent,
                usePageNumberInUrlHash: this.usePageNumberInUrlHash,
                pageContentType: this.pageContentType,
                imageHorizontalMargin: this.imageHorizontalMargin,
                imageVerticalMargin: this.imageVerticalMargin,
                useJavaScriptDocumentDescription: this.useJavaScriptDocumentDescription,
                searchPartialWords: this.searchPartialWords,
                variableHeightPageSupport: this.variableHeightPageSupport,
                textSelectionSynchronousCalculation: this.textSelectionSynchronousCalculation,
                minimumImageWidth: this.minimumImageWidth,
                fileDisplayName: this.fileDisplayName,
                preventTouchEventsBubbling: this.preventTouchEventsBubbling,
                watermarkText: this.watermarkText,
                instanceId: this.instanceId
            }, this.viewerOptions);

            docViewer = this.docSpace.groupdocsViewingComponent(viewerOptions);
            docViewerViewModel = this.docSpace.groupdocsViewingComponent('getViewModel');
        }
        else {
            docViewer = this.docSpaceCreator();
            docViewerViewModel = this.docSpaceViewModel();
        }

        var docViewerPageFlip = null;
        var docViewerPageFlipViewModel = null;

        if (this.docSpacePageFlip) {
            docViewerPageFlip = this.docSpacePageFlip.docViewerPageFlip({
                userId: this.userId,
                userKey: this.userKey,
                baseUrl: this.baseUrl,
                fileId: this.fileId,
                fileVersion: this.fileVersion,
                quality: this.quality,
                use_pdf: this.use_pdf,
                pageImageWidth: this.pageImageWidth,
                _mode: this._mode,
                docViewerId: this.docViewerId,
                createHtml: this.createHtml,
                initialZoom: this.initialZoom,
                alwaysOnePageInRow: this.alwaysOnePageInRow,
                zoomToFitWidth: this.zoomToFitWidth,
                zoomToFitHeight: this.zoomToFitHeight,
                viewerWidth: this.viewerWidth,
                viewerHeight: this.viewerHeight,
                selectionContent: this.selectionContent,
                minimumImageWidth: this.minimumImageWidth
            });
            docViewerPageFlipViewModel = this.docSpacePageFlip.docViewerPageFlip('getViewModel');
        }

        if (this.navigation) {
            navigation = this.navigation.navigation(this.navigationOptions);
            navigationViewModel = this.navigation.navigation('getViewModel');
        }

        if (this.search) {
            //search = this.search;
            search = this.search.search($.extend(this.searchOptions, { viewerViewModel: docViewerViewModel }));
            searchViewModel = this.search.search('getViewModel');
        }

        if (this.zooming) {
            zooming = this.zooming.zooming(this.zoomingOptions || {});
            zoomViewModel = this.zooming.zooming('getViewModel');
        }

        if (this.embedSource) {
            embedSource = this.embedSource.embedSource();
            embedSourceViewModel = this.embedSource.embedSource('getViewModel');
        }

        if (this.viewTypeMenu) {
            viewTypeMenu = this.viewTypeMenu;
            viewTypeViewModel = this.viewTypeViewModel;
        }

        this.docViewerViewModel = docViewerViewModel;
        this.docViewerPageFlipViewModel = docViewerPageFlipViewModel;
        this.navigationViewModel = navigationViewModel;
        this.thumbnailsViewModel = thumbnailsViewModel;
        this.zoomViewModel = zoomViewModel;
        this.searchViewModel = searchViewModel;
        this.embedSourceViewModel = embedSourceViewModel;

        docViewer.bind('getPagesCount', function (e, pagesCount) {
            if (navigation) {
                navigationViewModel.setPagesCount(pagesCount);
            }
        } .bind(this));

        docViewer.bind("onDocumentloadingStarted", function (e) {
            if (thumbnails) {
                thumbnailsViewModel.hideThumbnails();
            }
        } .bind(this));

        docViewer.bind("documentLoadFailed.groupdocs", function (e) {
            if (thumbnails) {
                thumbnailsViewModel.showThumbnails(true);
            }
        } .bind(this));
        

        docViewer.bind('_onProcessPages', function (e, data, pages, getDocumentPageHtmlCallback, viewerViewModel, pointToPixelRatio, docViewerId) {
            if (thumbnails) {
                thumbnailsViewModel.onProcessPages(data, pages, getDocumentPageHtmlCallback, viewerViewModel, pointToPixelRatio, docViewerId);
            }
        } .bind(this));
        docViewer.bind('onScrollDocView', function (e, data) {
            if (thumbnails) {
                thumbnailsViewModel.setThumbnailsScroll(data);
            }
            if (navigation) {
                navigationViewModel.setPageIndex(data.pi);
            }
            if (search) {
                searchViewModel.scrollPositionChanged(data.position);
            }
        } .bind(this));
        docViewer.bind('onSearchPerformed', function (e, searchCountItem) {
            if (search) {
                //searchViewModel.onSearchPerformed(searchCountItem);
            }
        } .bind(this));

        docViewer.bind('onDocumentPageSet', function (e, newPageIndex) {
            if (docViewerPageFlipViewModel)
                docViewerPageFlipViewModel.onDocumentPageSet(newPageIndex);

            if (search)
                searchViewModel.documentPageSetHandler();
        });

        docViewer.bind('onDocumentLoadComplete', function (e, data, pdf2XmlWrapper) {
            if (docViewerPageFlipViewModel)
                docViewerPageFlipViewModel._onDocumentLoaded(data, pdf2XmlWrapper);

            var url = data.url;
            $("#btnDownload,#btnDownload2").bind({
                click: function () {
                    window.location.href = url;
                    return false;
                }
            });

            if (zooming) {
                if (docViewerViewModel.isScrollViewerVisible()) {
                    zoomViewModel.setFitWidthZoom(docViewerViewModel.getFitWidthZoom());
                    zoomViewModel.setFitHeightZoom(docViewerViewModel.getFitHeightZoom());
                    zoomViewModel.setZoomWithoutEvent(docViewerViewModel.zoom());
                }
                else {
                    if (docViewerPageFlipViewModel) {
                        zoomViewModel.setFitWidthZoom(docViewerPageFlipViewModel.getFitWidthZoom());
                        zoomViewModel.setFitHeightZoom(docViewerPageFlipViewModel.getFitHeightZoom());
                        zoomViewModel.setZoomWithoutEvent(docViewerPageFlipViewModel.zoom());
                    }
                }
            }

            if (search) {
                searchViewModel.documentLoaded();
            }
        } .bind(this));

        if (docViewerPageFlip) {
            docViewerPageFlip.bind('onPageTurned', function (e, pageIndex) {
                if (navigation) {
                    navigationViewModel.setPageIndex(pageIndex);
                }
                if (thumbnails) {
                    thumbnailsViewModel.pageInd(pageIndex);
                }
                docViewerViewModel.pageInd(pageIndex);
                docViewerViewModel.setPageNumerInUrlHash(pageIndex);
            });
        }

        if (search) {
            search.bind('onPerformSearch', function (e, value, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch) {
                docViewerViewModel.performSearch(value, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch);
            });
        }

        if (navigation) {
            navigation.bind('onUpNavigate', function (e, pageIndex) {
                if (docViewerPageFlipViewModel)
                    docViewerPageFlipViewModel.setPage(pageIndex);

                docViewerViewModel.setPage(pageIndex);
                if (thumbnails) {
                    thumbnailsViewModel.setPageWithoutEvent(pageIndex);
                    thumbnailsViewModel.setThumbnailsScroll({ pi: pageIndex, direction: 'up' });
                }
            } .bind(this));
            navigation.bind('onDownNavigate', function (e, pageIndex) {
                if (docViewerPageFlipViewModel)
                    docViewerPageFlipViewModel.setPage(pageIndex);

                docViewerViewModel.setPage(pageIndex);
                if (thumbnails) {
                    thumbnailsViewModel.setPageWithoutEvent(pageIndex);
                    thumbnailsViewModel.setThumbnailsScroll({ pi: pageIndex, direction: 'down' });
                }
            } .bind(this));
            navigation.bind('onSetNavigate', function (e, data) {
                if (docViewerPageFlipViewModel)
                    docViewerPageFlipViewModel.setPage(data.pageIndex);

                docViewerViewModel.setPage(data.pageIndex);
                if (thumbnails) {
                    thumbnailsViewModel.setPageWithoutEvent(data.pageIndex);
                    thumbnailsViewModel.setThumbnailsScroll({ pi: data.pageIndex, direction: data.direction, eventAlreadyRaised: true });
                }
            } .bind(this));
        }

        if (zooming) {
            zooming.bind('onSetZoom', function (e, value) {
                if (docViewerPageFlipViewModel)
                    docViewerPageFlipViewModel.setZoom(value);
                docViewerViewModel.setZoom(value);
                if (search) {
                    searchViewModel.resetButtons();
                }
            } .bind(this));

            zooming.bind(menuClickedEvent, function () {
                if (viewTypeMenu)
                    viewTypeViewModel.showDropDownMenu(false);
            });
        }

        if (thumbnails) {
            thumbnails.bind('onSetThumbnails', function (e, index) {
                docViewerViewModel.setPage(index);
                if (docViewerPageFlipViewModel)
                    docViewerPageFlipViewModel.setPage(index);
                if (navigation) {
                    navigationViewModel.setPageIndex(index);
                }
            } .bind(this));
            thumbnails.bind('onSetThumbnailsScroll', function (e, index) {
                if (navigation) {
                    navigationViewModel.setPageIndex(index);
                }
            } .bind(this));
            thumbnails.bind('onResizeThumbnails', function (e, viewerLeft) {
                docViewerViewModel.resizeViewerElement(viewerLeft);
                if (docViewerPageFlipViewModel)
                    docViewerPageFlipViewModel.resizeViewerElement(viewerLeft);
            });
            thumbnails.bind('onPageReordered', function (e, oldPosition, newPosition) {
                docViewerViewModel.onPageReordered(oldPosition, newPosition);
            });
        }

        if (viewTypeMenu) {
            viewTypeMenu.bind(menuClickedEvent, function () {
                if (zoomViewModel)
                    zoomViewModel.showDropDownMenu(false);
            });
        }
    },

    thumbnailsCreator: function () {
    },

    thumbnailsViewModelCreator: function () {
        return { set: function () { },
            setThumbnailsScroll: function () { },
            onProcessPages: function () { },
            getThumbnailsPanelWidth: function () { return 0; } 
        };
    }
});