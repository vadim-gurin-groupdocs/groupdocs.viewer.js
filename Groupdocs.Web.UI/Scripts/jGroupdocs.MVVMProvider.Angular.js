if (!window.groupdocs)
    window.groupdocs = {};

window.groupdocs.bindingProvider = {
    getValue: function(variable) {
        return variable; // AngularJS uses regular variables - not observables
    },
    setValue: function (object, property, value) {
        object[property] = value;
    },
    getObservable: function(initialValue) {
        return initialValue;
    },
    getObservableArray: function(initialValue) {
        return initialValue;
    },

    createHtmlAndApplyBindings: function (componentName, viewModel, element) {
        var self = this;
        angular.element(element).injector().invoke(['$compile', function ($compile) {
            // Create a scope for the Imager Dialog's body.
            var scope = angular.element(element).scope();
            scope.viewModel = viewModel;

            //$scope.zoomIn = function () { self._viewModel.zoomIn(); }

            //var compiled = $compile(markup)($scope);
            // Ensure the scope has been signalled to digest our data.
            //$scope.$digest();
            var markup = self.componentHtml[componentName];
            var angularElement = angular.element(markup),

            compiled = $compile(angularElement);

            angularElement.appendTo(element);

            //bind our view to the scope!
            compiled(scope);

            //compiled.appendTo(self.element[0]);
        }]);
    },

    componentHtml: {
        "paging":
'<div class="left">' +
'    <a class="new_head_tools_btn h_t_i_zoomin" href="#" data-ng-click="viewModel.zoomIn()" data-tooltip="Zoom In" data-localize-tooltip="ZoomIn"> </a>' +
'    <a class="new_head_tools_btn h_t_i_zoomout" href="#" data-ng-click="viewModel.zoomOut()" data-tooltip="Zoom Out" data-localize-tooltip="ZoomOut"> </a>' +
'    <div class="new_head_tools_dropdown_wrapper">' +
'        <a class="new_head_tools_btn head_tool_dropdown_btn h_t_i_zoom" href="#" data-ng-click="viewModel.toggleDropDownMenu()" data-tooltip="Zoom Level" data-localize-tooltip="ZoomLevel">' +
'        </a>' +
'        <ul class="dropdown-menu head_tool_dropdown" data-ng-style="{display: (viewModel.dropDownMenuIsVisible ? \'block\' : \'none\')}" data-bind="style: {display: (dropDownMenuIsVisible() ? \'block\' : \'none\')}, foreach: zooms">' +
'            <li data-ng-repeat="zoom in viewModel.zooms">' +
'                <a href="#" data-ng-click="viewModel.setZoom(zoom)" data-bind="text: name, event: { mousedown: function(item, e) { $parent.setZoom(item, e); } }, attr: {\'data-localize\': $data.localizationKey }">{{zoom.name}}</a>' +
'            </li>' +
'        </ul>' +
'    </div>' +
'</div>'
    }
}