(function ($, undefined) {
    $.groupdocsWidget('groupdocsFileOpenDialog', {
        _viewModel: null,
        options: {
            autoOpen: true,
            url: '',
            uploadWebFiles: false,
            fileTypes: "doc,docx,docm,dot,dotx,dotm,rtf,odt,ott,pdf",
            resourcePrefix: ""
        },

        _create: function () {
            this.bindingProvider = new window.groupdocs.bindingProvider();
            this.options.bindingProvider = this.bindingProvider;
            this._createHtml();
            this.fileExplorer = this.element.find(".file_browser_content");
            this._viewModel = this.getViewModel();
        },

        _init: function () {
        },

        _createHtml: function () {
            var root = this.element;
            root.addClass('modal ' +
                            'fade ' +
                            'modal2 ' +
                            'modal800px');
            this.bindingProvider.createHtml("fileBrowser", this.element, this.options);
            root.trigger("onHtmlCreated");
        },

        _createViewModel: function () {
            var url = this.options.hostUrl;
            var userId = this.options.userId;
            var userKey = this.options.userKey;
            var fileExplorer = $(this.fileExplorer).groupdocsExplorer({ userId: userId, privateKey: userKey, pageSize: 30, fileTypes: this.options.fileTypes, urlHashEnabled: this.options.urlHashEnabled, instanceIdToken: this.options.instanceIdToken });
            var fileUploader = null;//$(this.fileUploader).groupdocsUploader({ url: url, userId: userId, key: userKey, proxy: 'Uploader.aspx', fld: '', multiple: true, addFileBtn: $(this.uploadButton) });

            return new fileOpenDialogViewModel(this, fileUploader, fileExplorer);
        },

        getViewModel: function () {
            if (!this._viewModel) {
                this._viewModel = this._createViewModel();
            }

            return this._viewModel;
        },

        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });

})(jQuery);