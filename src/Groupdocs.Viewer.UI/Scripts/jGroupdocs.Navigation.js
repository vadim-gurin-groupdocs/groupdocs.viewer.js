(function ($, undefined) {
    "use strict";

    $.groupdocsWidget('navigation', {
        _viewModel: null,
        _pageCount: 0,

        _create: function () {
            this.bindingProvider = new window.groupdocs.bindingProvider();
            this.options.bindingProvider = this.bindingProvider;

            if (this.options.createHtml) {
                this._createHtml();
            }
            else if (this.options.createEmbeddedHtml) {
                this._createEmbeddedHtml();
            }
            this._viewModel = this.getViewModel();
            this.bindingProvider.applyBindings(this._viewModel, this.element);
        },
        _createViewModel: function () {
            var viewModel = {
                pageInd: this.bindingProvider.getObservable(0),
                pageCount: this.bindingProvider.getObservable(0)
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
            this.bindingProvider.createHtml("navigation", this.element, this.options);
            root.trigger("onHtmlCreated");
        }
    });
})(jQuery);