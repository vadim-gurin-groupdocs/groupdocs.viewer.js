if (!window.groupdocs)
    window.groupdocs = {};

window.groupdocs.bindingProvider = function() {
};

$.extend(window.groupdocs.bindingProvider.prototype, {
    scope: null,

    getValue: function(variable) {
        return variable; // AngularJS uses regular variables - not observables
    },
    setValue: function (object, property, value) {
        object[property] = value;
        if (this.scope)
            this.scope.$digest();
    },
    getObservable: function(initialValue) {
        return initialValue;
    },
    getObservableArray: function(initialValue) {
        return initialValue;
    },

    createHtml: function (componentName, element, options) {
        var markup = this.componentHtml[componentName](options);
        var angularElement = angular.element(markup);
        angularElement.appendTo(element[0]);
    },

    applyBindings: function (viewModel, element) {
        var self = this;
        angular.element(element[0]).injector().invoke(['$compile', function ($compile) {
            var angularElement = angular.element(element[0]);
            var scope = angularElement.scope().$new(true);
            scope.viewModel = viewModel;
            self.scope = scope;
            var compiled = $compile(angularElement);
            compiled(scope);
            scope.$digest();
        }]);
    },

    componentHtml: {
        "zooming": function (options) {
            return '<div class="left">' +
'    <a class="new_head_tools_btn h_t_i_zoomin" href="#" data-ng-click="viewModel.zoomIn()" data-tooltip="Zoom In" data-localize-tooltip="ZoomIn"> </a>' +
'    <a class="new_head_tools_btn h_t_i_zoomout" href="#" data-ng-click="viewModel.zoomOut()" data-tooltip="Zoom Out" data-localize-tooltip="ZoomOut"> </a>' +
'    <div class="new_head_tools_dropdown_wrapper">' +
'        <a class="new_head_tools_btn head_tool_dropdown_btn h_t_i_zoom" href="#" data-ng-click="viewModel.toggleDropDownMenu()" data-tooltip="Zoom Level" data-localize-tooltip="ZoomLevel">' +
'        </a>' +
'        <ul class="dropdown-menu head_tool_dropdown" data-ng-style="{display: (viewModel.dropDownMenuIsVisible ? \'block\' : \'none\')}" data-bind="style: {display: (dropDownMenuIsVisible() ? \'block\' : \'none\')}, foreach: zooms">' +
'            <li data-ng-repeat="zoom in zoomingViewModel.zooms">' +
'                <a href="#" data-ng-click="viewModel.setZoom(zoom)" data-bind="text: name, event: { mousedown: function(item, e) { $parent.setZoom(item, e); } }, attr: {\'data-localize\': $data.localizationKey }">{{zoom.name}}</a>' +
'            </li>' +
'        </ul>' +
'    </div>' +
'</div>';
        },

        "viewing": function (options) {
            var rotationMarkup;
            if (options.supportPageRotation) {
                rotationMarkup = ' + \' translateY(\' + ((viewModel.isHtmlDocument && $data.rotation() == 180) ? \'100%\' : \'0\') + \') \' +' +
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
//'                        css: {chrome: $root.browserIsChrome(), \'page-image\': !$root.useTabsForPages(), child_invisible: !$data.visible()}, ' +
'                        css: {chrome: $root.browserIsChrome(), \'page-image\': !$root.useTabsForPages()}, ' +
'                        style: { ' +
'                                 width: $root.rotatedWidth(), ' +
            msScale +
'                                 MozTransform: \'scale(\' + $data.heightRatio() * $root.zoom() / 100.0  + \')\' ' + rotationMarkup + ', ' +
'                                 \'-webkit-transform\': \'scale(\' + $data.heightRatio() * $root.zoom() / 100.0  + \')\' ' + rotationMarkup +
'                               }">' +
'            </div>' + htmlBasedWatermarkMarkup;

            var useHtmlBasedEngine = (options.pageContentType == "html");
            var pagesContainerElementHtml = 'class="pages_container ' + (useHtmlBasedEngine ? 'html_pages_container' : '') + '" data-ng-style="{ height: viewModel.useVirtualScrolling ? (viewModel.documentHeight + \'px\') : \'auto\', width: (viewModel.layout == viewModel.Layouts.TwoPagesInRow || viewModel.layout == viewModel.Layouts.CoverThenTwoPagesInRow) ? (viewModel.pageWidth + viewModel.imageHorizontalMargin) * 2 + \'px\': \'auto\'}" data-bind="style: { height: $root.useVirtualScrolling ? ($root.documentHeight() + \'px\') : \'auto\', width: ($root.layout() == $root.Layouts.TwoPagesInRow || $root.layout() == $root.Layouts.CoverThenTwoPagesInRow) ? ($root.pageWidth() + $root.imageHorizontalMargin) * 2 + \'px\': \'auto\'}"';

            var viewerHtml =

'<div id="' + options.docViewerId + 'PagesContainer" ' + pagesContainerElementHtml + '>' +
//    '<!-- ko foreach: { data: $root.useVirtualScrolling ? pages.slice(firstVisiblePageForVirtualMode(), lastVisiblePageForVirtualMode() + 1) : pages, afterRender: function(){$root.highlightSearch();} } -->' +
    '<div data-ng-repeat="page in viewModel.pages" class="doc-page" data-ng-attr-id="{{viewModel.pagePrefix + ((viewModel.useVirtualScrolling ? viewModel.firstVisiblePageForVirtualMode : 0) + $index + 1)}}" data-ng-style="viewModel.pageElementStyle($index)" data-ng-class="{cover_page: (viewModel.layout == viewModel.Layouts.CoverThenTwoPagesInRow && (viewModel.useVirtualScrolling ? viewModel.firstVisiblePageForVirtualMode : 0) + $index == 0)}" data-bind="attr: {id: viewModel.pagePrefix + ((viewModel.useVirtualScrolling ? viewModel.firstVisiblePageForVirtualMode : 0) + $index + 1)}, style: viewModel.pageElementStyle($index), css: {cover_page: (viewModel.layout == viewModel.Layouts.CoverThenTwoPagesInRow && (viewModel.useVirtualScrolling ? viewModel.firstVisiblePageForVirtualMode : 0) + $index == 0)}" >' +
'       <div class="viewer_loading_overlay" data-ng-style="{display: ((viewModel.alwaysShowLoadingSpinner || viewModel.inprogress || !page.visible) ? \'block\' : \'none\'), zIndex: (viewModel.inprogress || !page.visible ? 2 : 0), width: viewModel.pageWidth + \'px\', height: viewModel.autoHeight ? \'100%\' : (viewModel.pageWidth * page.prop + \'px\'), backgroundColor: (viewModel.inprogress || !page.visible ? \'\' : \'transparent\')}" data-bind="visible: ($root.alwaysShowLoadingSpinner() || $root.inprogress() || !visible()), style: { zIndex: ($root.inprogress() || !visible() ? 2 : 0), width: $root.pageWidth() + \'px\', height: $root.autoHeight() ? \'100%\' : ($parent.pageWidth() * $data.prop() + \'px\'), backgroundColor: ($root.inprogress() || !visible() ? \'\' : \'transparent\')}" style="width: 850px; height: 1100px;position: absolute;left:0;top:0">' +
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
'           <img class="page-image" src="' + options.emptyImageUrl + '" data-ng-attr-id="{{\'' + options.docViewerId + '\' + \'-img-\' + ($index + 1)}}" data-ng-src="{{(page.visible ? page.url : viewModel.emptyImageUrl)}}" data-ng-style="{ width: viewModel.pageWidth + \'px\', height: viewModel.pageWidth * page.prop + \'px\' }" data-bind="attr: { id: \'' + options.docViewerId + '\' + \'-img-\' + ($index() + 1), src: (viewModel.visible ? page.url : viewModel.emptyImageUrl) }, ' +
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
        }
    }
});