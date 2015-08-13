if (!window.groupdocs)
    window.groupdocs = {};

window.groupdocs.bindingProvider = {
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

    createHtmlAndApplyBindings: function (componentName, viewModel, element) {
        var markup = this.componentHtml[componentName];
        $(markup).appendTo(element);
        ko.applyBindings(viewModel, element.get(0));
    },

    componentHtml: {
        "paging":
'<div class="left">' +
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
'</div>'
    }
}