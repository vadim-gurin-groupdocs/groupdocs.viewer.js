(function ($, undefined) {
    $.groupdocsWidget('navigation', {
        _viewModel: null,
        _pageCount: 0,

        _create: function () {
            if (this.options.createHtml) {
                this._createHtml();
            }
            else if (this.options.createEmbeddedHtml) {
                this._createEmbeddedHtml();
            }
            this._viewModel = this.getViewModel();
            ko.applyBindings(this._viewModel, this.element.get(0));
        },
        _createViewModel: function () {
            var viewModel = {
                pageInd: ko.observable(0),
                pageCount: ko.observable(0)
            };

            viewModel.up = function () {
                this.up();
            } .bind(this);

            viewModel.down = function () {
                this.down();
            } .bind(this);

            viewModel.selectPage = function (pageIndex) {
                this.set(pageIndex);
            } .bind(this);

            viewModel.onKeyPress = function (viewModelObject, e) {
                this.onKeyPress(e);
                return true;
            } .bind(this);

            viewModel.setPageIndex = function (index) {
                this.setPageIndex(index);
            } .bind(this);

            viewModel.openFirstPage = function () {
                this.set(1);
            } .bind(this);

            viewModel.openLastPage = function () {
                this.set(this._viewModel.pageCount());
            } .bind(this);

            viewModel.setPagesCount = function (pagesCount) {
                this.setPagesCount(pagesCount);
            } .bind(this);

            return viewModel;
        },
        getViewModel: function () {
            if (!this._viewModel) {
                this._viewModel = this._createViewModel();
            }
            return this._viewModel;
        },
        up: function () {
            var ci = this._viewModel.pageInd();
            var pc = this._viewModel.pageCount();
            var ni;
            if (ci <= 0)
                ni = 1;
            else {
                if (ci > pc)
                    ni = pc;
                else
                    ni = ci != 1 ? ci - 1 : 1;
            }
            this._viewModel.pageInd(ni);
            $(this.element).trigger('onUpNavigate', ni);
        },
        down: function () {
            var ci = this._viewModel.pageInd();
            var pc = this._viewModel.pageCount();
            var ni;
            if (ci <= 0)
                ni = 1;
            else {
                if (ci > pc)
                    ni = pc;
                else
                    ni = ci != pc ? (parseInt(ci) + 1) : ci;
            }
            this._viewModel.pageInd(ni);
            $(this.element).trigger('onDownNavigate', ni);
        },

        set: function (index) {
            var oldPageIndex = this._viewModel.pageInd();
            var newPageIndex = this.setPageIndex(index);

            var direction = 'up';
            if (oldPageIndex > newPageIndex)
                direction = 'down';
            $(this.element).trigger('onSetNavigate', { pageIndex: newPageIndex, direction: direction });
        },

        setPageIndex: function (index) {
            var newPageIndex = Number(index);

            var pc = this._viewModel.pageCount();
            if (isNaN(newPageIndex))
                newPageIndex = 1;
            else if (newPageIndex <= 0)
                newPageIndex = 1;
            else if (newPageIndex > pc)
                newPageIndex = pc;

            this._viewModel.pageInd(newPageIndex);
            return newPageIndex;
        },

        openFirstPage: function () {
            this.selectPage(1);
        },

        openLastPage: function () {
            this.selectPage(this.pageCount());
        },

        onKeyPress: function (e) {
            if (e.keyCode == 13) {
                this.set(this._viewModel.pageInd());
            }
        },
        setPagesCount: function (pagesCount) {
            this._pageCount = pagesCount;
            this._viewModel.pageCount(pagesCount);
        },

        _createHtml: function () {
            var root = this.element;
            root.addClass('left');

            $('<span class="new_head_tools_btn h_t_i_nav1" data-bind="click: function() { selectPage(1); }, css: {disabled: pageInd() <= 1}" data-tooltip="First Page" data-localize-tooltip="FirstPage"></span>' +
              '<span class="new_head_tools_btn h_t_i_nav2" data-bind="click: up, css: {disabled: pageInd() <= 1}" data-tooltip="Previous Page" data-localize-tooltip="PreviousPage"></span>' +
              '<input class="new_head_input" type="text" style="width: 17px;" data-bind="value: pageInd, valueUpdate: [\'afterkeydown\'], event: { keyup: onKeyPress }" />' +
              '<p class="new_head_of" data-localize="Of">of</p>' +
              '<p class="new_head_of" data-bind="text: pageCount()"></p>' +
            //'<p class="new_head_of" data-bind="text: \'of \' + pageCount()"></p>' +
              '<span class="new_head_tools_btn h_t_i_nav3" data-bind="click: down, css: {disabled: pageInd() >= pageCount()}" data-tooltip="Next Page" data-localize-tooltip="NextPage"></span>' +
              '<span class="new_head_tools_btn h_t_i_nav4" data-bind="click: function() { selectPage(this.pageCount()); }, css: {disabled: pageInd() >= pageCount()}" data-tooltip="Last Page" data-localize-tooltip="LastPage"></span>').appendTo(root);
            root.trigger("onHtmlCreated");
        },

        _createEmbeddedHtml: function () {
            var root = this.element;
            root.addClass('left');

            $('<span class="embed_viewer_icons icon1" data-bind="click: function() { selectPage(1); }"></span>' +
              '<span class="embed_viewer_icons icon2" data-bind="click: up"></span>' +
              '<p>Page</p>' +
              '<input type="text" name="textfield" class="page_nmbr" data-bind="value: pageInd, valueUpdate: [\'afterkeydown\'],  event: { keyup: onKeyPress }"/>' +
              '<p>of <span data-bind="text: pageCount()" ></span></p>' +
              '<span class="embed_viewer_icons icon3" data-bind="click: down"></span>' +
              '<span class="embed_viewer_icons icon4" data-bind="click: function() { selectPage(this.pageCount()); }"></span>'
                ).appendTo(root);
            root.trigger("onHtmlCreated");
        }

    });
})(jQuery);