if (!window.groupdocs)
    window.groupdocs = {};

window.groupdocs.bindingProvider = function () {
    this.create();
};

$.extend(window.groupdocs.bindingProvider.prototype, {
    scope: null,

    create: function () {
        window.groupdocs.bindingProvider.prototype.$compileProvider.directive("ngGroupdocsScrollable", function () {
            return {
                restrict: "A",
                link: function (scope, elem, attr, ctrl) {
                    elem.bind("scrollstop", function (e, data) {
                        scope.viewModel.ScrollDocViewEnd(data, e);
                        e.returnValue = false;
                        return true;
                    })
                    .bind("scroll", function (e, data) {
                        scope.viewModel.ScrollDocView(data, e);
                        e.returnValue = false;
                        return true;
                    });
                }
            }
        });

        window.groupdocs.bindingProvider.prototype.$compileProvider.directive("ngGroupdocsSearchInput", function () {
            return {
                restrict: "A",
                link: function (scope, elem, attr, ctrl) {
                    elem.bind("keypress", function (e) {
                        scope.viewModel.keyPressed(scope.viewModel, e);
                    })
                    .bind("keydown", function (e) {
                        scope.viewModel.keyDown(scope.viewModel, e);
                    });
                }
            }
        });

        window.groupdocs.bindingProvider.prototype.$compileProvider.directive("ngGroupdocsHtml", function() {
            return {
                restrict: "A",
                link: function (scope, elem, attr, ctrl) {
                    if (attr.ngGroupdocsHtml) {
                        elem.html(scope.$eval(attr.ngGroupdocsHtml));
                    }

                    scope.$watch(attr.ngGroupdocsHtml, function (newValue, oldValue) {
                        if (newValue && newValue !== oldValue) {
                            elem.html(newValue);
                        }
                    });
                }
            }
        });


        window.groupdocs.bindingProvider.prototype.$compileProvider.directive("ngGroupdocsSearchText", function () {
            return {
                restrict: "A",
                link: function (scope, element, attr, ctrl) {
                    var page = scope.page;
                    if (!page.searched) {
                        var value = scope.$eval(attr.ngGroupdocsSearchText);
                        scope.viewModel.parseSearchParameters(element.get(0), value);
                    }
                    scope.$watch(attr.ngGroupdocsSearchText, function (newValue, oldValue) {
                        if (newValue && newValue !== oldValue) {
                            scope.viewModel.parseSearchParameters(element.get(0), newValue);
                        }
                    });
                    page.searched = false;
                }
            }
        });
        
    },

    
    getObservable: function (initialValue) {
        var value = initialValue;
        var self = this;
        return function (param) {
            if (typeof param == "undefined")
                return value;
            else {
                value = param;
                if (self.scope) {
                    var phase = self.scope.$root.$$phase;
                    if (phase != '$apply' && phase != '$digest') {
                        self.scope.$digest();
                    }
                }
            }
        };
    },

    getObservableArray: function (initialValue) {
        var internalArray;
        if (typeof param == "undefined")
            internalArray = new Array();
        else
            internalArray = initialValue;
        var self = this;
        var observableArray = function (param) {
            if (typeof param == "undefined")
                return internalArray;
            else {
                internalArray = param;
                if (self.scope)
                    self.scope.$digest();
            }
        };

        observableArray.push = function (valueToPush) {
            internalArray.push(valueToPush);
            if (self.scope)
                self.scope.$digest();
        };

        observableArray.removeAll = function () {
            internalArray.length = 0;
            if (self.scope)
                self.scope.$digest();
        };
        
        return observableArray;
    },

    getComputedObservable: function (functionParam) {
        return functionParam;
    },

    createHtml: function (componentName, element, options) {
        var markup = this.componentHtml[componentName](options);
        var angularElement = angular.element(markup);
        angularElement.appendTo(element[0]);
    },

    applyBindings: function (viewModel, element) {
        var self = this;
        var scope = window.groupdocs.bindingProvider.prototype.$rootScope.$new(true);
        scope.viewModel = viewModel;
        self.scope = scope;
        var compiled = window.groupdocs.bindingProvider.prototype.$compile(element);
        compiled(scope);
        scope.$digest();
    },

    componentHtml: {
        "zooming": function (options) {
            return '<div class="left">' +
'    <a class="new_head_tools_btn h_t_i_zoomin" href="#" data-ng-click="viewModel.zoomIn()" data-tooltip="Zoom In" data-localize-tooltip="ZoomIn"> </a>' +
'    <a class="new_head_tools_btn h_t_i_zoomout" href="#" data-ng-click="viewModel.zoomOut()" data-tooltip="Zoom Out" data-localize-tooltip="ZoomOut"> </a>' +
'    <div class="new_head_tools_dropdown_wrapper">' +
'        <a class="new_head_tools_btn head_tool_dropdown_btn h_t_i_zoom" href="#" data-ng-click="viewModel.toggleDropDownMenu(viewModel, $event)" data-tooltip="Zoom Level" data-localize-tooltip="ZoomLevel">' +
'        </a>' +
'        <ul class="dropdown-menu head_tool_dropdown" data-ng-style="{display: (viewModel.dropDownMenuIsVisible() ? \'block\' : \'none\')}" >' +
'            <li data-ng-repeat="zoom in viewModel.zooms()">' +
'                <a href="#" data-ng-click="viewModel.setZoom(zoom)" data-ng-attr-data-localize="{{zoom.localizationKey}}"  data-bind="event: { mousedown: function(item, e) { $parent.setZoom(item, e); } }">{{zoom.name}}</a>' +
'            </li>' +
'        </ul>' +
'    </div>' +
'</div>';
        },

        "viewing": function (options) {
            var rotationMarkup;
            if (options.supportPageRotation) {
                rotationMarkup = ' + \' translateY(\' + ((viewModel.isHtmlDocument() && page.rotation() == 180) ? \'100%\' : \'0\') + \') \' +' +
                    ' \'rotate(\' + page.rotation() + \'deg)\' +' +
                    ' \' translateX(\' + ((page.rotation() == 180 || page.rotation() == 270) ? \'-100%\' : \'0\') + \')\' +' +
                    ' \' translateY(\' + ((page.rotation() == 90 || (!viewModel.isHtmlDocument() && page.rotation() == 180)) ? \'-100%\' : \'0\') + \') \'  ';
            }
            else {
                rotationMarkup = "";
            }

            var msScale = '\'-ms-transform\': \'scale(\' + page.heightRatio() * viewModel.zoom() / 100.0 + \')\' ';

            if (options.pageContentType == "html" && $.browser.msie) {
                if ($.browser.version == 8)
                    msScale = 'zoom: page.heightRatio() * viewModel.zoom() / 100.0 ';
                else {
                    msScale += rotationMarkup;
                }
            }
            msScale += ",";

            var htmlBasedWatermarkMarkup;
            if (options.watermarkText) {
                htmlBasedWatermarkMarkup =
                '<svg xmlns="http://www.w3.org/2000/svg" class="html_watermark" data-ng-attr-width="{{viewModel.pageWidth() + viewModel.imageHorizontalMargin + \'px\'}}" data-ng-attr-height="{{viewModel.pageWidth() * page.prop() + \'px\'}}" data-ng-attr-view-box="{{\'0 0 100 \' + 100 * page.prop()}}" pointer-events="none">' +
                        '<text data-ng-style="{fill: viewModel.intToColor(viewModel.watermarkColor)}" ' +
                        'data-ng-attr-transform="{{viewModel.watermarkTransform(page, $element)}}" ' +
                        'data-ng-attr-y="{{viewModel.watermarkPosition.indexOf(\'Top\') == -1 ? 100 * page.prop() :\'10\'}}" font-family="Verdana" font-size="10" x="0" y="0" >{{viewModel.watermarkText}}</text>' +
                        '</svg>';
            }
            else {
                htmlBasedWatermarkMarkup = "";
            }
            var htmlPageContents =
'           <div class="html_page_contents"' +
'                 data-ng-groupdocs-html="page.htmlContent()" ' +
                         'data-ng-attr-id="{{\'' + options.docViewerId + 'pageHtml-\' + page.number}}" ' +
                         'data-ng-groupdocs-search-text="page.searchText()" ' +
'                        data-ng-class="{chrome: viewModel.browserIsChrome(), \'page-image\': !viewModel.useTabsForPages()}" ' +
'                        data-ng-style=" { ' +
'                                 width: viewModel.rotatedWidth(), ' +
            msScale +
'                                 MozTransform: \'scale(\' + page.heightRatio() * viewModel.zoom() / 100.0  + \')\' ' + rotationMarkup + ', ' +
'                                 \'-webkit-transform\': \'scale(\' + page.heightRatio() * viewModel.zoom() / 100.0  + \')\' ' + rotationMarkup +
'                               }">' +
'            </div>' + htmlBasedWatermarkMarkup;

            var useHtmlBasedEngine = (options.pageContentType == "html");
            var pagesContainerElementHtml = 'class="pages_container ' + (useHtmlBasedEngine ? 'html_pages_container' : '') + '" data-ng-style="viewModel.pagesContainerStyle()" ';

            var viewerHtml =

'<div id="' + options.docViewerId + 'PagesContainer" ' + pagesContainerElementHtml + '>' +
//    '<!-- ko foreach: { afterRender: function(){$root.highlightSearch();} } -->' +
    '<div data-ng-repeat="page in viewModel.useVirtualScrolling ? viewModel.pages().slice(viewModel.firstVisiblePageForVirtualMode(), viewModel.lastVisiblePageForVirtualMode() + 1) : viewModel.pages()" class="doc-page" data-ng-attr-id="{{viewModel.pagePrefix + ((viewModel.useVirtualScrolling ? viewModel.firstVisiblePageForVirtualMode() : 0) + $index + 1)}}" data-ng-style="viewModel.pageElementStyle($index)" data-ng-class="{cover_page: (viewModel.layout() == viewModel.Layouts.CoverThenTwoPagesInRow && (viewModel.useVirtualScrolling ? viewModel.firstVisiblePageForVirtualMode() : 0) + $index == 0)}" >' +
'       <div class="viewer_loading_overlay" data-ng-style="{display: ((viewModel.alwaysShowLoadingSpinner() || viewModel.inprogress() || !page.visible()) ? \'block\' : \'none\'), zIndex: (viewModel.inprogress() || !page.visible() ? 2 : 0), width: viewModel.pageWidth() + \'px\', height: viewModel.autoHeight() ? \'100%\' : (viewModel.pageWidth() * page.prop() + \'px\'), backgroundColor: (viewModel.inprogress() || !page.visible() ? \'\' : \'transparent\')}" style="width: 850px; height: 1100px;position: absolute;left:0;top:0">' +
'           <div class="loading_overlay_message">' +
'               <span class="progresspin"></span>' +
'               <p data-localize="LoadingYourContent">Loading your content...</p>' +
'           </div>' +
'       </div>' +

(useHtmlBasedEngine ?
(
    htmlPageContents
)
:
'           <div class="button-pane"></div>' +
'           <div class="highlight-pane"></div>' +
'           <div class="custom-pane"></div>' +
'           <div class="search-pane"></div>' +
'           <img class="page-image" src="' + options.emptyImageUrl + '" data-ng-attr-id="{{\'' + options.docViewerId + '\' + \'-img-\' + ($index + 1)}}" data-ng-src="{{(page.visible() ? page.url() : viewModel.emptyImageUrl)}}" data-ng-style="{ width: viewModel.pageWidth() + \'px\', height: viewModel.pageWidth() * page.prop() + \'px\' }" ' +
'           style: { width: viewModel.pageWidth + \'px\', height: viewModel.pageWidth * page.prop + \'px\' }"/>'
) +

'   </div>' +
//    '<!-- /ko -->' +

'</div>';

//'<div class="tab_control_wrapper" data-bind="visible: useTabsForPages && tabs().length > 0">' +
//'<ul class="doc_viewer_tab_control" data-bind="foreach: tabs, visible: useTabsForPages && tabs().length > 0">' +
//'   <li data-bind="css:{active:$index() == $root.activeTab()}">' +
//'      <a href="#" data-bind="text:name, click: function(){$root.activateTab($index());}"></a>' +
//'   </li>' +
//'</ul>' +
//'</div>';
            return viewerHtml;
        },

        "initializationComponent": function (options) {
            return '<div dir="ltr" class="groupdocs_viewer_wrapper grpdx ' + options.classWithNumber + /*browserDependentCssClass + */'">' +
                '<div class="viewer_header header_sidescroll" ' + options.headerStyle + '>' +
                '   <div class="viewer_header_wrapper">' +
                '      <a class="btnOpen new_head_tools_btn h_t_i_browser" data-tooltip="Open File" data-localize-tooltip="OpenFile"></a>' +
                '      <div name="printAndDownloadToolbar" class="new_head_tools_wrapper left">' +
                '          <a class="new_head_tools_btn h_t_i_download btn_download" data-tooltip="Download" data-localize-tooltip="Download"></a>' +
                '          <a class="new_head_tools_btn h_t_i_print print_button" data-tooltip="Print" data-localize-tooltip="Print"></a>' +
                '      </div>' +
                '      <div class="navigation-bar left' + (options.browserIsIE8 ? " ie8" : "") + '">' +
                '      </div>' +
                '      <div class="new_head_tools_wrapper zoom_wrappper">' +
                '      </div>' +
                '      <div class="new_head_tools_dropdown_wrapper viewTypeMenu">' +
                '			<a class="new_head_tools_btn head_tool_dropdown_btn h_t_i_singlepage" data-ng-click="viewModel.toggleDropDownMenu(null, $event)" href="#" data-tooltip="View Mode" data-localize-tooltip="ViewMode"></a>' +
                '			<ul class="dropdown-menu head_tool_dropdown" style="display: none;" data-ng-style="{display: (viewModel.dropDownMenuIsVisible() ? \'block\' : \'none\')}">' +
                '				<li style="display: inline">' +
                '					<a data-ng-click="viewModel.openScrollView()" href="#">' +
                '						<span class="h_t_d_i_scroll"></span>' +
                '						<p data-localize="ScrollView">Scroll View</p>' +
                '					</a>' +
                '				</li>' +
                '				<li style="display: inline" name="openDoublePageFlipViewMenuItem">' +
                '					<a data-ng-click="viewModel.openDoublePageFlipView()" href="#">' +
                '						<span class="h_t_d_i_double"></span>' +
                '						<p data-localize="BookMode">Double Page Flip</p>' +
                '					</a>' +
                '				</li>' +

                '				<li style="display: inline">' +
                '					<a data-ng-click="viewModel.openOnePageInRowView()" href="#">' +
                '						<span class="h_t_d_i_scroll"></span>' +
                '						<p data-localize="OnePageInRow">One Page in Row</p>' +
                '					</a>' +
                '				</li>' +

                '				<li style="display: inline">' +
                '					<a data-ng-click="viewModel.openTwoPagesInRowView()" href="#">' +
                '						<span class="h_t_d_i_double"></span>' +
                '						<p data-localize="TwoPagesInRow">Two Pages in Row</p>' +
                '					</a>' +
                '				</li>' +

                '				<li style="display: inline">' +
                '					<a data-ng-click="viewModel.openCoverThenTwoPagesInRowView()" href="#">' +
                '						<span class="h_t_d_i_double"></span>' +
                '						<p data-localize="CoverThenTwoPagesInRow">Cover then Two Pages in Row</p>' +
                '					</a>' +
                '				</li>' +
                
                '			</ul>' +
                '		</div>' +

                '      <div name="search_wrapper" class="new_head_tools_wrapper" data-bind="visible:visible">' +
                '      </div>' +

                (options.supportPageRotation ?
                '<div class="new_head_tools_wrapper">' +
                '      <a name="rotateClockwise" class="h_t_i_rotatecl new_head_tools_btn" data-tooltip="Rotate Clockwise" data-localize-tooltip="RotateClockwise"></a>' +
                '      <a name="rotateCounterClockwise" class="h_t_i_rotatecon new_head_tools_btn" data-tooltip="Rotate Counter-Clockwise" data-localize-tooltip="RotateCounterClockwise"></a>' +
                '</div>'
                : "") +
                '   </div>' +
                '</div>' +
                '<div class="fileOpenDialogWrapper" style="display: none"></div>' +
                '<div class="viewer_mainwrapper ' + options.browserDependentCssClass + '">' +
                '   <div id=' + options.docViewerId + ' class="doc_viewer" data-ng-groupdocs-scrollable data-bind="event: { scroll: function(item, e) { this.ScrollDocView(item, e); }, scrollstop: function(item, e) { this.ScrollDocViewEnd(item, e);e.returnValue = false;return true; } }">' +
                '   </div>' +
                '   <div class="doc_viewer_wrapper_page_flip" style="overflow: auto; top: -50000px; position: absolute;height: 100%">' +
                '   </div>' +
                (options.showThumbnails ? '   <a class="thumbs_btn" href="#"></a>' : '') +
                '</div>' +
                '<div name="jGDerror" class="modal_dialog_wrapper jerrorwrapper">' +
                '   <div class="modal_dialog_overlay">' +
                '       &nbsp;' +
                '   </div>' +
                '   <div class="modal_dialog_content_wrapper">' +
                '       <div class="modal_dialog_header">' +
                '          Error' +
                '       </div>' +
                '       <div class="modal_dialog_content">' +
                '       </div>' +
                '   </div>' +
                '</div>' +

                '<div name="messageDialog" class="modal_dialog_content_wrapper modal_progressbar" style="display:none">' +
                '   <a name="minimizeButton" class="icon_minimize" href="#">&ndash;</a>' +
                '   <a name="maximizeButton" class="icon_maximize" href="#">+</a>' +
                '   <div class="modal_dialog_header">' +
                '      <span name="alwaysVisibleTitle">Printing </span>' +
                '      <span name="visibleWhenMinimizedTitle" class="percent">0%</span>' +
                '   </div>' +
                '   <div class="modal_dialog_content">' +
                '      <p name="message">Preparing page </p>' +
                '      <div class="progressbar">' +
                '      <div style="width: 50%" class="progress"></div></div>' +
                '   </div>' +
                '</div>' +

                '<div name="messageDialogPdf" class="modal_dialog_content_wrapper modal_progressbar" style="display:none">' +
                '   <a name="minimizeButtonPdf" class="icon_minimize" href="#">&ndash;</a>' +
                '   <a name="maximizeButtonPdf" class="icon_maximize" href="#">+</a>' +
                '   <div class="modal_dialog_header">' +
                '      <span name="alwaysVisibleTitlePdf">Printing </span>' +
                '   </div>' +
                '   <div class="modal_dialog_content">' +
                '      <p name="messagePdf">Preparing page </p>' +
                '   </div>' +
                '</div>' +

            '</div>';
        },

        "navigation": function()
        {
            return '<span class="new_head_tools_btn h_t_i_nav1" data-ng-click="viewModel.selectPage(1)" data-ng-class="{disabled: viewModel.pageInd() <= 1}" data-tooltip="First Page" data-localize-tooltip="FirstPage"></span>' +
              '<span class="new_head_tools_btn h_t_i_nav2" data-ng-click="viewModel.up()" data-ng-class="{disabled: viewModel.pageInd() <= 1}" data-tooltip="Previous Page" data-localize-tooltip="PreviousPage"></span>' +
              '<input class="new_head_input" type="text" style="width: 17px;" data-ng-model-options="{getterSetter: true, updateOn: \'afterkeydown\'}" data-ng-model="viewModel.pageInd" data-bind="event: { keyup: onKeyPress }" />' +
              '<p class="new_head_of" data-localize="Of">of</p>' +
              '<p class="new_head_of">{{viewModel.pageCount()}}</p>' +
              '<span class="new_head_tools_btn h_t_i_nav3" data-ng-click="viewModel.down()" data-ng-class="{disabled: viewModel.pageInd() >= viewModel.pageCount()}" data-tooltip="Next Page" data-localize-tooltip="NextPage"></span>' +
              '<span class="new_head_tools_btn h_t_i_nav4" data-ng-click="viewModel.selectPage(viewModel.pageCount())" data-ng-class="{disabled: viewModel.pageInd() >= viewModel.pageCount()}" data-tooltip="Last Page" data-localize-tooltip="LastPage"></span>';
        },

        "search": function () {
            return '<input type="text" placeholder="Search" class="input_search" data-localize-ph="Search" data-ng-style="{display: (viewModel.visible() ? \'block\' : \'none\')}" data-ng-attr-dir="{dir: useRtl ? \'rtl\' : \'ltr\'}" data-ng-model-options="{getterSetter: true, updateOn: \'default keydown propertychange input\'}" data-ng-model="viewModel.searchValue" data-ng-groupdocs-search-input="">' +
'<span class="input_search_clear" data-ng-style="{display: (viewModel.visible() ? \'block\' : \'none\')}" data-ng-click="viewModel.clearValue()" data-bind=", clickBubble: false"></span>' +
'<span class="new_head_tools_btn h_t_i_nav2" data-ng-style="{display: (viewModel.visible() ? \'block\' : \'none\')}" data-ng-click="viewModel.findPreviousFromUI()" data-ng-class="{disabled:!viewModel.previousEnabled()}" data-tooltip="Search Backward" data-localize-tooltip="SearchBackward"></span>' +
'<span class="new_head_tools_btn h_t_i_nav3" data-ng-style="{display: (viewModel.visible() ? \'block\' : \'none\')}" data-ng-click="viewModel.findNextFromUI()" data-ng-class="{disabled:!viewModel.nextEnabled()}" data-tooltip="Search Forward" data-localize-tooltip="SearchForward"></span>';
        }
    }
});