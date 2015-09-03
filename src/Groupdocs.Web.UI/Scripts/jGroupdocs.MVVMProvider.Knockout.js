(function ($) {
    "use strict";

    if (!window.groupdocs)
        window.groupdocs = {};

    window.groupdocs.bindingProvider = function () {
        this.create();
    };

    $.extend(window.groupdocs.bindingProvider.prototype, {
        areBindingsCreated: false,

        create: function () {
            if (!window.groupdocs.bindingProvider.prototype.areBindingsCreated) {
                ko.bindingHandlers.sortableArray = {
                    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                        var thumbnails = valueAccessor();
                        $(element).sortable({
                            axis: "y",
                            update: function(event, ui) {
                                var movedElement = ui.item[0];
                                //retrieve our actual data item
                                var dataItem = ko.dataFor(movedElement);
                                //figure out its new position
                                var oldPosition = thumbnails.indexOf(dataItem);
                                var newPosition = ko.utils.arrayIndexOf(ui.item.parent().children(), movedElement);
                                ui.item.remove();
                                //remove the item and add it back in the right spot
                                if (newPosition >= 0) {
                                    thumbnails.remove(dataItem);
                                    thumbnails.splice(newPosition, 0, dataItem);
                                }
                                viewModel.rootElement.trigger("onPageReordered", [oldPosition, newPosition]);
                            }
                        });
                    }
                };

                if (!ko.bindingHandlers.searchText) {
                    ko.bindingHandlers.searchText = {
                        update: function (element, valueAccessor, allBindings, viewModelParam, bindingContext) {
                            var viewModel = bindingContext.$root;
                            var page = bindingContext.$data;
                            if (!page.searched) {
                                var value = ko.utils.unwrapObservable(valueAccessor());
                                viewModel.parseSearchParameters(element, value);
                            }
                            page.searched = false;
                        }
                    };
                }

                if (!ko.bindingHandlers.parsedHtml) {
                    ko.bindingHandlers.parsedHtml = {
                        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                            var modelValue = valueAccessor();
                            var jqueryElement = $(element);
                            var elementValue = jqueryElement.html();

                            if (ko.isWriteableObservable(modelValue)) {
                                modelValue(elementValue);
                            }
                            else { //handle non-observable one-way binding
                                var allBindings = allBindingsAccessor();
                                if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers'].parsedHtml)
                                    allBindings['_ko_property_writers'].parsedHtml(elementValue);
                            }
                        },
                        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                            var value = ko.unwrap(valueAccessor()) || "";
                            var page = bindingContext.$data;
                            var jqueryElement = $(element);
                            jqueryElement.empty();
                            if (value) {
                                if (typeof page.currentValue == "undefined"
                                    || page.currentValue === null
                                    || page.currentValue != value) {
                                    var trimmedValue = value.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "");
                                    page.parsedHtmlElement = $(trimmedValue);
                                    page.currentValue = value;
                                }
                                jqueryElement.append(page.parsedHtmlElement);
                            }
                            else {
                                page.parsedHtmlElement = null;
                                page.currentValue = null;
                            }
                        }
                    };
                }

                window.groupdocs.bindingProvider.prototype.areBindingsCreated = true;
            }
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
            var result = this.componentHtml[componentName](options);
            if (result.element)
                return result;
            else
                $(result).appendTo(element);
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
    '                        css: {\'page-image\': !$root.useTabsForPages()}, ' +
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
    '       <div class="viewer_loading_overlay" data-bind="visible: ($root.alwaysShowLoadingSpinner() || $root.inprogress() || !visible()), style: $root.loadingOverlayStyle($data)"" style="width: 850px; height: 1100px;position: absolute;left:0;top:0">' +
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
            },

            "fileBrowser": function () {
        return '<div class="modal_inner_wrapper">' +
            '<div data-dismiss="modal" class="popclose">' +
            '</div>' +
            '<div class="modal_header">' +
            '   <h3 data-localize="OpenFile">Open File</h3>' +
            '</div>' +
            '<div class="modal_content">' +
                '<div class="modal_input_wrap_left">' +
                    '<div class="file_browser_content">' +
                        '<div style="position: relative; display: inline-block; overflow: hidden;" class="file_browser_toolbar">' +
                            '<!-- ko with: isNotRootFolder -->' +
                                '<a data-bind="click: function () { $parent.openParentFolder();}" data-localize="ParentFolder" class="small_button file_browser_upload_btn">Parent folder</a>' +
                            '<!-- /ko -->' +
                        '</div>' +
                        '<div style="position: relative;">' +
                            '<div style="position: relative;">' +
                            '</div>' +
                            '<div class="file_browser_sort">' +
                                '<a class="file_browser_sort_filename" data-bind="click: function() { setOrder(\'Name\');}" href="#">' +
                                    '<h4 data-localize="FileName">File Name</h4>' +
                                    '<span data-bind="visible: orderBy() === \'Name\', css: {up: orderAsc(), down: !orderAsc()}" class="smallarrow">' +
                                    '</span>' +
                                '</a>' +
                                '<a class="file_browser_sort_size" data-bind="click: function() { setOrder(\'Size\');}" href="#">' +
                                    '<h4 data-localize="Size">Size</h4>' +
                                    '<span data-bind="visible: orderBy() === \'Size\', css: {up: orderAsc(), down: !orderAsc()}" class="smallarrow"></span>' +
                                '</a>' +
                                '<a class="file_browser_sort_modified" data-bind="click: function() { setOrder(\'ModifiedOn\');}" href="#">' +
                                    '<h4 data-localize="Modified">Modified</h4>' +
                                    '<span data-bind="visible: orderBy() === \'ModifiedOn\', css: {up: orderAsc(), down: !orderAsc()}" class="smallarrow"></span>' +
                                '</a>' +
                            '</div>' +
                            '<ul data-bind="foreach: folders" class="file_browser_folder_list">' +
                                '<li data-bind="attr: { id: \'explorer-entity-\' + id }, click: open">' +
                                    '<div class="file_browser_listbox folderlist">' +
                                        '<span class="listicons licon_folder"></span>' +
                                        '<p data-bind="text: name()" class="listname_file_browser foldername"></p>' +
                                    '</div>' +
                                '</li>' +
                            '</ul>' +
                            '<ul data-bind="foreach: files" class="file_browser_file_list">' +
                                '<li data-bind="attr: { id: \'explorer-entity-\' + id }, click: open">' +
                                    '<div class="file_browser_listbox filelist">' +
                                        '<span data-bind="css: { \'licon_unkwn\': (docType() != \'words\' && docType() != \'pdf\' &&  docType() != \'slides\' &&docType() != \'cells\' && docType() != \'image\' && docType() != \'email\' && docType() != \'diagram\' && docType() != \'project\' && docType() != \'taggedimage\'), \'licon_word\': docType() == \'words\', \'licon_pdf\': docType() == \'pdf\', \'licon_ppt\': docType() == \'slides\', \'licon_xls\': docType() == \'cells\', \'licon_bmp\': (docType() == \'image\' || docType() == \'taggedimage\'), \'licon_outlook\': docType() == \'email\', \'licon_visio\': docType() == \'diagram\', \'licon_mpp\': docType() == \'project\' }" class="listicons"></span>' +
                                        '<p data-bind="text: name()" class="listname_file_browser filenameellipses"></p>' +
                                        '<p data-bind="text: (sizeInKb() + \'Kb\')" class="listfilesize listsmalltext"></p>' +
                                        '<p data-bind="text: modifiedOn()" class="listfilesize listsmalltext"></p>' +
                                    '</div>' +
                                '</li>' +
                            '</ul>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="modal_footer">' +
                '<div class="modal_btn_wrapper">' +
                '</div>' +
            '</div>' +
        '</div>';
            },

            "thumbnails": function (options) {
                var root = options.element;
                var result = {};
                var foreachOperator;
                if (options.supportPageReordering) {
                    foreachOperator = "foreach: thumbnails, sortableArray: thumbnails";
                }
                else {
                    foreachOperator = "foreach: thumbnails";
                }

                result.element = $(
    '<div class="thumbnailsContainer" data-bind="event: { scroll: function(e) { scrollThumbnailsPanel(e); } }, visible: openThumbnails">' +
        '<ul class="vertical-list2 ui-selectable" data-bind="' + foreachOperator + '">' +
            '<li class="thumb-page ui-selectee" data-bind="style: {height: $data.wrapperHeight + \'px\'}, css: { \'ui-selected\': ($index() + 1) == $root.pageInd() }, click: function() { $root.selectPage($index() + 1); }">' +

    (options.useHtmlThumbnails ?
    (
            '<div class="thumbnail_wrapper" data-bind="style: {width:$data.width() + \'px\',height: $data.height() + 2 * $data.verticalPadding() + \'px\'}">' +
                '<div class="html_page_contents"' +
                    'data-bind="html: htmlContent, ' +
                        'visible: visible(),' +
                        'attr: {id: $root.docViewerId + \'pageHtml-\' + ($index() + 1) },' +
                        'style: { padding: $data.verticalPadding() + \'px 0\', ' +
                            'MozTransform: \'scale(\' + $data.scale() + \')\', ' +
                                        '\'-webkit-transform\': \'scale(\' + $data.scale() + \')\',' +
                                        '\'-ms-transform\': \'scale(\' + $data.scale() + \')\' }">' +
                '</div>' +

                '<div class="html_page_contents mouse_intercept_overlay">' +
                '</div>'
    )
    :
    (
                    '<div class="thumbnail_wrapper" data-bind="style: {height: $data.height() + 2 * $data.verticalPadding() + \'px\'}">' +
                        '<img class="ui-selectee thumb_image" src="' + options.emptyImageUrl + '" data-bind="attr: {src: visible() ? url() : $root.emptyImageUrl}, style: {width: (visible() ? $data.width() : 0) + \'px\', height: (visible() ? $data.height() : 0) + \'px\', padding: $data.verticalPadding() + \'px 0\', backgroundColor: $data.backgroundColor()}" />'
    )) +

                    '</div>' +
                '<span class="progresspin thumb_progress"></span>' +
            '</li>' +
        '</ul>' +
    '</div>');

                if (options.useInnerThumbnails) {
                    result.thumbnailPanelElement = $('<div class="thumbnail_panel"></div>');
                    result.element.appendTo(result.thumbnailPanelElement);
                    result.toggleThumbnailsButton = $('<div class="thumbnail_stripe">' +
                            '<a class="thumbnail_open" data-bind="click:function(){toggleThumbnails();}"></a>' +
                        '</div>');
                    result.toggleThumbnailsButton.appendTo(result.thumbnailPanelElement);
                    result.thumbnailPanelElement.prependTo(root);
                }
                else {
                    result.element.appendTo(root);
                }
                result.rootElement = root;
                return result;
            }

        }
    });

})(jQuery);