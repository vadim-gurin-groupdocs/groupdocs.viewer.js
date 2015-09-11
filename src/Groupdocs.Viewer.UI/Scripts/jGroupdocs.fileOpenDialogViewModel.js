(function ($, undefined) {
    "use strict";

    window.fileOpenDialogViewModel = function (fileOpenDialog, fileExplorer) {
        this.fileOpenDialog = fileOpenDialog;
        this.fileExplorer = fileExplorer;

        this._init();
    };

    $.extend(fileOpenDialogViewModel.prototype, {
        _explorerViewModel: null,

        _init: function () {
            this.fileExplorer.bind('onNodeSelected', this._onExplorerNodeSelected.bind(this));
            this._explorerViewModel = $(this.fileExplorer).groupdocsExplorer("getViewModel");
        },

        _onExplorerNodeSelected: function (e, node) {
            if (node.id > 0 && node.type === 'file') {
                $(this.fileOpenDialog.fileExplorer).trigger('fileSelected', node);
            }
        }
    });

})(jQuery);