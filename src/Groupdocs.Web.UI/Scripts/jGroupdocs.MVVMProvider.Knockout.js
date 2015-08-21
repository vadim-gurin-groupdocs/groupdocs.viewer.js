if (!window.groupdocs)
    window.groupdocs = {};

window.groupdocs.bindingProvider = function () {
    this.create();
};

$.extend(window.groupdocs.bindingProvider.prototype, {
    create: function() {
    },

    getValue: function(variable) {
        return variable(); // KnockoutJS uses functions
    },
    setValue: function (object, property, value) {
        object[property](value);
    },
    getObservable: function(initialValue) {
        return ko.observable(initialValue);
    },
    getObservableArray: function(initialValue) {
        return ko.observableArray(initialValue);
    },

    getComputedObservable: function (functionParam) {
        return ko.computed(functionParam);
    },

    createHtml: function (componentName, element, options) {
        var markup = this.componentHtml[componentName](options);
        $(markup).appendTo(element);
    },

    applyBindings: function (viewModel, element) {
        ko.applyBindings(viewModel, element.get(0));
    },

    componentHtml: {
        "zooming": function (options) {
            return '<div class="left">' +
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
'</div>';
        },

        "viewing": function(options) {
            var rotationMarkup;
            if (options.supportPageRotation) {
                rotationMarkup = ' + \' translateY(\' + (($root.isHtmlDocument() && $data.rotation() == 180) ? \'100%\' : \'0\') + \') \' +' +
                    ' \'rotate(\' + $data.rotation() + \'deg)\' +' +
                    ' \' translateX(\' + (($data.rotation() == 180 || $data.rotation() == 270) ? \'-100%\' : \'0\') + \')\' +' +
                    ' \' translateY(\' + (($data.rotation() == 90 || (!$root.isHtmlDocument() && $data.rotation() == 180)) ? \'-100%\' : \'0\') + \') \'  ';
            }
            else {
                rotationMarkup = "";
            }

            var msScale = '\'-ms-transform\': \'scale(\' + $data.heightRatio() * $root.zoom() / 100.0 + \')\' ';

            if (options.pageContentType == "html" && $.browser.msie) {
                if ($.browser.version == 8)
                    msScale = 'zoom: $data.heightRatio() * $root.zoom() / 100.0 ';
                else {
                    msScale += rotationMarkup;
                }
            }
            msScale += ",";

            var htmlBasedWatermarkMarkup;
            if (options.watermarkText) {
                htmlBasedWatermarkMarkup =
                '<svg xmlns="http://www.w3.org/2000/svg" class="html_watermark" data-bind="attr:{width: $root.pageWidth() + $root.imageHorizontalMargin + \'px\', height: $root.pageWidth() * $data.prop() + \'px\', viewBox:\'0 0 100 \' + 100 * $data.prop()}" pointer-events="none">' +
                        '<text data-bind="text:$root.watermarkText, style:{fill:$root.intToColor($root.watermarkColor)}, ' +
                        'attr:{transform:$root.watermarkTransform($data, $element), ' +
                        'y:$root.watermarkPosition.indexOf(\'Top\') == -1 ? 100 * $data.prop() :\'10\'}" font-family="Verdana" font-size="10" x="0" y="0" ></text>' +
                        '</svg>';
            }
            else {
                htmlBasedWatermarkMarkup = "";
            }
            var htmlPageContents =
'           <div class="html_page_contents"' +
'                 data-bind="' + (options.useVirtualScrolling ? 'parsedHtml' : 'html') + ': htmlContent(), ' +
                         'attr: { id:\'' + options.docViewerId + 'pageHtml-\' + number }, ' +
                         'searchText: searchText, ' +
'                        css: {chrome: $root.browserIsChrome(), \'page-image\': !$root.useTabsForPages()}, ' +
'                        style: { ' +
'                                 width: $root.rotatedWidth(), ' +
            msScale +
'                                 MozTransform: \'scale(\' + $data.heightRatio() * $root.zoom() / 100.0  + \')\' ' + rotationMarkup + ', ' +
'                                 \'-webkit-transform\': \'scale(\' + $data.heightRatio() * $root.zoom() / 100.0  + \')\' ' + rotationMarkup +
'                               }">' +
'            </div>' + htmlBasedWatermarkMarkup;

            var useHtmlBasedEngine = (options.pageContentType == "html");
            var pagesContainerElementHtml = 'class="pages_container ' + (useHtmlBasedEngine ? 'html_pages_container' : '') + '" data-bind="style: pagesContainerStyle()"';

            var viewerHtml =

'<div id="' + options.docViewerId + 'PagesContainer" ' + pagesContainerElementHtml + '>' +
    '<!-- ko foreach: { data: $root.useVirtualScrolling ? pages.slice(firstVisiblePageForVirtualMode(), lastVisiblePageForVirtualMode() + 1) : pages, afterRender: function(){$root.highlightSearch();} } -->' +
    '<div class="doc-page" data-bind="attr: {id: $root.pagePrefix + (($root.useVirtualScrolling ? $root.firstVisiblePageForVirtualMode() : 0) + $index() + 1)}, style: $root.pageElementStyle($index()), css: {cover_page: ($root.layout() == $root.Layouts.CoverThenTwoPagesInRow && ($root.useVirtualScrolling ? $root.firstVisiblePageForVirtualMode() : 0) + $index() == 0)}" >' +
'       <div class="viewer_loading_overlay" data-bind="visible: ($root.alwaysShowLoadingSpinner() || $root.inprogress() || !visible()), style: { zIndex: ($root.inprogress() || !visible() ? 2 : 0), width: $root.pageWidth() + \'px\', height: $root.autoHeight() ? \'100%\' : ($parent.pageWidth() * $data.prop() + \'px\'), backgroundColor: ($root.inprogress() || !visible() ? \'\' : \'transparent\')}" style="width: 850px; height: 1100px;position: absolute;left:0;top:0">' +
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
'           <img class="page-image" src="' + options.emptyImageUrl + '" data-bind="attr: { id: \'' + options.docViewerId + '\' + \'-img-\' + ($index() + 1), src: (visible() ? url : $root.emptyImageUrl) }, ' +
'           style: { width: $parent.pageWidth() + \'px\', height: $parent.pageWidth() * $data.prop() + \'px\' }"/>'
) +

'   </div>' +
    '<!-- /ko -->' +

'</div>' +

'<div class="tab_control_wrapper" data-bind="visible: useTabsForPages && tabs().length > 0">' +
'<ul class="doc_viewer_tab_control" data-bind="foreach: tabs, visible: useTabsForPages && tabs().length > 0">' +
'   <li data-bind="css:{active:$index() == $root.activeTab()}">' +
'      <a href="#" data-bind="text:name, click: function(){$root.activateTab($index());}"></a>' +
'   </li>' +
'</ul>' +
'</div>';
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
                '			<a class="new_head_tools_btn head_tool_dropdown_btn h_t_i_singlepage" data-bind="click: toggleDropDownMenu" href="#" data-tooltip="View Mode" data-localize-tooltip="ViewMode"></a>' +
                '			<ul class="dropdown-menu head_tool_dropdown" style="display: none;" data-bind="style: {display: (dropDownMenuIsVisible() ? \'block\' : \'none\')}">' +
                '				<li style="display: inline">' +
                '					<a data-bind="click: openScrollView" href="#">' +
                '						<span class="h_t_d_i_scroll"></span>' +
                '						<p data-localize="ScrollView">Scroll View</p>' +
                '					</a>' +
                '				</li>' +
                '				<li style="display: inline" name="openDoublePageFlipViewMenuItem">' +
                '					<a data-bind="click: openDoublePageFlipView" href="#">' +
                '						<span class="h_t_d_i_double"></span>' +
                '						<p data-localize="BookMode">Double Page Flip</p>' +
                '					</a>' +
                '				</li>' +

                '				<li style="display: inline">' +
                '					<a data-bind="click: openOnePageInRowView" href="#">' +
                '						<span class="h_t_d_i_scroll"></span>' +
                '						<p data-localize="OnePageInRow">One Page in Row</p>' +
                '					</a>' +
                '				</li>' +

                '				<li style="display: inline">' +
                '					<a data-bind="click: openTwoPagesInRowView" href="#">' +
                '						<span class="h_t_d_i_double"></span>' +
                '						<p data-localize="TwoPagesInRow">Two Pages in Row</p>' +
                '					</a>' +
                '				</li>' +

                '				<li style="display: inline">' +
                '					<a data-bind="click: openCoverThenTwoPagesInRowView" href="#">' +
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
                '   <div id=' + options.docViewerId + ' class="doc_viewer" data-ng-scrollable data-bind="event: { scroll: function(item, e) { this.ScrollDocView(item, e); }, scrollstop: function(item, e) { this.ScrollDocViewEnd(item, e);e.returnValue = false;return true; } }">' +
                '   </div>' +
                '   <div class="doc_viewer_wrapper_page_flip" style="overflow: auto; top: -50000px; position: absolute;height: 100%">' +
                '   </div>' +
                (options.showThumbnails ? '   <a class="thumbs_btn" href="#"></a>' : '') +
                '</div>' +
            //'<a class="thumbs_btn" href="#"></a>' +
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

        "navigation": function () {
            return '<span class="new_head_tools_btn h_t_i_nav1" data-bind="click: function() { selectPage(1); }, css: {disabled: pageInd() <= 1}" data-tooltip="First Page" data-localize-tooltip="FirstPage"></span>' +
              '<span class="new_head_tools_btn h_t_i_nav2" data-bind="click: up, css: {disabled: pageInd() <= 1}" data-tooltip="Previous Page" data-localize-tooltip="PreviousPage"></span>' +
              '<input class="new_head_input" type="text" style="width: 17px;" data-bind="value: pageInd, valueUpdate: [\'afterkeydown\'], event: { keyup: onKeyPress }" />' +
              '<p class="new_head_of" data-localize="Of">of</p>' +
              '<p class="new_head_of" data-bind="text: pageCount()"></p>' +
              '<span class="new_head_tools_btn h_t_i_nav3" data-bind="click: down, css: {disabled: pageInd() >= pageCount()}" data-tooltip="Next Page" data-localize-tooltip="NextPage"></span>' +
              '<span class="new_head_tools_btn h_t_i_nav4" data-bind="click: function() { selectPage(this.pageCount()); }, css: {disabled: pageInd() >= pageCount()}" data-tooltip="Last Page" data-localize-tooltip="LastPage"></span>';
        },

        "search": function () {
            return '<input type="text" placeholder="Search" class="input_search" data-localize-ph="Search" data-bind="visible: visible, attr: {dir: useRtl ? \'rtl\' : \'ltr\'}, value: searchValue, valueUpdate: [\'afterkeydown\', \'propertychange\', \'input\'], event: { keypress: keyPressed, keydown: keyDown }">' +
'<span class="input_search_clear" data-bind="visible: visible, click: function(){$root.clearValue();}, clickBubble: false"></span>' +
'<span class="new_head_tools_btn h_t_i_nav2" data-bind="visible: visible, click: findPreviousFromUI, css:{disabled:!previousEnabled()}" data-tooltip="Search Backward" data-localize-tooltip="SearchBackward"></span>' +
'<span class="new_head_tools_btn h_t_i_nav3" data-bind="visible: visible, click: findNextFromUI, css:{disabled:!nextEnabled()}" data-tooltip="Search Forward" data-localize-tooltip="SearchForward"></span>';
        }
    }
});