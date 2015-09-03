(function ($, undefined) {
    "use strict";

    // File explorer view
    $.groupdocsWidget('groupdocsExplorer', {
        _viewModel: null,

        _init: function () {
            this.bindingProvider = new window.groupdocs.bindingProvider();
            this.options.bindingProvider = this.bindingProvider;

            this._viewModel = this.getViewModel();

            $(this._viewModel).bind('onNodeSelected', function (e, node, initialEvent) {
                $(this.element).trigger('onNodeSelected', [node, initialEvent]);
            }.bind(this));

            this.bindingProvider.applyBindings(this._viewModel, this.element);
        },

        _createViewModel: function () {
            return new window.groupdocs.explorerViewModel(this.options);
        },

        getViewModel: function () {
            if (!this._viewModel) {
                this._viewModel = this._createViewModel();
            }

            return this._viewModel;
        },

        setFilter: function (filter) {
            this._viewModel.setFilter(filter);
        },

        setOrder: function (order) {
            this._viewModel.setFilter(order);
        }
    });


    // File explorer model
    window.groupdocs.explorerModel = function (options) {
        $.extend(this.options, options);
        this._init();
    };

    $.extend(window.groupdocs.explorerModel.prototype, {
        _portalService: Container.Resolve("ServerExchange"),
        _path: '',
        _entitiesLoaded: 0,
        _entitiesTotal: 0,
        _filter: {
            name: '',
            types: null
        },
        options: {
            pageSize: 30,
            extended: false
        },
        _order: null,

        _init: function () {
            this.bindingProvider = this.options.bindingProvider;
            this._order = {
                by: 'Name',
                asc: true
            };
        },

        _loadPage: function (index, path, callback, errorCallback) {
            this._portalService.loadFileBrowserTreeData(path,
                    index ? index : 0, this.options.pageSize,
                    this._order.by, this._order.asc,
                    this._filter.name, this._filter.types, this.options.extended,
                    this.options.instanceIdToken,
                    function (response) {
                        if (response.textStatus === 'success') {
                            this._entitiesLoaded += response.data.nodes.length;
                            this._entitiesTotal = response.data.count;

                            callback.apply(this, [path, response.data.nodes]);
                        }
                        else {
                            errorCallback.apply(this, []);
                        }
                    } .bind(this),
                    function (error) {
                        errorCallback.apply(this, [error]);
                    } .bind(this)
              );
        },

        openFolder: function (path, callback, errorCallback) {
            this._path = path || '';
            this._entitiesLoaded = 0;
            this._entitiesTotal = 0;
            this._loadPage(0, this._path, callback, errorCallback);
        },

        loadMore: function (callback, errorCallback) {
            if (this._entitiesLoaded >= this._entitiesTotal) {
                return false;
            }

            var page = Math.ceil(this._entitiesLoaded / this.options.pageSize);
            this._loadPage(page, this._path, callback, errorCallback);
            return true;
        },

        setFilter: function (filter) {
            this._filter.name = filter.name;
            this._filter.types = filter.types;
        },

        setOrder: function(by, asc) {
            this._order.by = by;
            this._order.asc = asc;
        }
    });

    // File explorer view model
    window.groupdocs.explorerViewModel = function (options) {
        this._init(options);
    };

    $.extend(window.groupdocs.explorerViewModel.prototype, {
        _model: null,
        _filtering: false,
        _ordering: false,
        busy: null,
        path: null,
        entities: null,
        files: null,
        folders: null,
        _order: null,

        _init: function (options) {
            this._model = this._createModel(options);
            this.bindingProvider = options.bindingProvider;
            this.busy = this.bindingProvider.getObservable(false);
            this.path = this.bindingProvider.getObservable('');
            this.entities = this.bindingProvider.getObservableArray();
            this.files = this.bindingProvider.getObservableArray();
            this.folders = this.bindingProvider.getObservableArray();

            this.path = this.bindingProvider.getObservable('');
            this.entities = this.bindingProvider.getObservableArray();

            this.files = this.bindingProvider.getObservableArray();
            this.folders = this.bindingProvider.getObservableArray();
            this._order = {
                by: this.bindingProvider.getObservable('Name'),
                asc: this.bindingProvider.getObservable(true)
            };
            this._model.setOrder(this._order.by(), this._order.asc());

            var self = this;
            this.isNotRootFolder = this.bindingProvider.getComputedObservable(
                function () {
                    return !(self.path() === '');
                });
            this.openFolder(options.startupPath);
        },

        _createModel: function (options) {
            return new window.groupdocs.explorerModel(options);
        },

        _addRoot: function () {
            var root = this._createEntity('Home', 'folder');
            root.path = '';
            this.entities.push(root);
            return root;
        },

        _onEntitiesLoaded: function (path, entities) {            
            var self = this;
            if (self._filtering || self._ordering || path != self.path()) {
                self.entities.removeAll();
                self.files.removeAll();
                self.folders.removeAll();
            }

            var entitiesNotObservable = new Array();
            var filesNotObservable = new Array();
            var foldersNotObservable = new Array();
            $.each(entities, function (i) {                
                if (!this.extended) {
                    var e = this;
                    self._extendEntity(e);
                    entitiesNotObservable.push(e);
                }

                if (this.type == 'file') {
                    filesNotObservable.push(this);
                }
                else {
                    foldersNotObservable.push(this);
                }
            });

            self.entities(entitiesNotObservable);
            self.files(filesNotObservable);
            self.folders(foldersNotObservable);

            self._filtering = false;
            self._ordering = false;
            self.path(path);
            self.busy(false);
        },

        _onNetworkError: function (error) {
            this.busy(false);
            jerror(error.Reason || error);
        },

        _extendEntity: function (entity) {            
            var self = this;
            var supportedTypes = (entity.supportedTypes ? $.map(entity.supportedTypes, function (t) { return t.toUpperCase(); }) : []);
            
            $.extend(entity, {
                extended: true,
                name: self.bindingProvider.getObservable(entity.name),
                isNewVersion:false,
                sizeInKb: self.bindingProvider.getObservable(Math.round(entity.size / 1024)),
                docType: self.bindingProvider.getObservable((entity && entity.docType) ? entity.docType.toLowerCase() : ""),
                modifiedOn: function () { return (isNaN(entity.modifyTime) || entity.modifyTime < 0 ? '---' : new Date(entity.modifyTime).format('mmm dd, yyyy')); },
                supportedTypes: self.bindingProvider.getObservableArray(supportedTypes),
                thumbnail: self.bindingProvider.getObservable(entity.thumbnail),
                selected: self.bindingProvider.getObservable(false),
                isVisible: self.bindingProvider.getObservable(true)
            });

            entity.open = function (e) {
                if (entity.type === 'file') {
                    $(self).trigger('onNodeSelected', [entity, e]);
                } else
                    self.openFolder(entity.path);
            };
        },

        _findEntity: function (name, type) {
            for (var i = 0; i < this.entities().length; i++) {
                var node = this.entities()[i];
                if (node.name().toLowerCase() == name.toLowerCase() && node.type == type) {
                    return node;
                }
            }

            return null;
        },

        _findEntityAt: function (path, type) {
            for (var i = 0; i < this.entities().length; i++) {
                var node = this.entities()[i];
                if (node.path().toLowerCase() == path.toLowerCase() && node.type == type) {
                    return node;
                }
            }

            return null;
        },

        _createEntity: function (name, type, size, path) {
            var entity = {
                id: 0,
                path: (this.path().trim('/') + '/' + (path ? path : name)).trim('/'),
                name: name,
                type: type,
                docType: 'undefined',
                time: new Date().getTime(),
                modifyTime: new Date().getTime(),
                url: undefined,
                isKnown: false,
                fileCount: 0,
                folderCount: 0,
                supportedTypes: [],
                selected: false,
                size: size
            };

            this._extendEntity(entity);
            return entity;
        },

        _getPathLevel: function (path) {
            return (path && path.length > 0 ? path.length - path.replace(/\/+/g, '').length + 1 : 0);
        },

        getSelectedEntities: function () {            
            return $.map(this.entities(), function (item) {
                if (item.id && item.selected()) return item;
            });
        },

        openFolder: function (path) {
            if (this.busy()) {
                return;
            }

            this.busy(true);
            this._model.openFolder(path, this._onEntitiesLoaded.bind(this), this._onNetworkError.bind(this));
        },

        openParentFolder: function () {
            var i = this.path().lastIndexOf('/');
            var path = this.path().substr(0, i > 0 ? i : 0);
            if (path != this.path()) {
                this.openFolder(path);
            }
        },

        loadMore: function () {
            if (!this.busy()) {
                this.busy(
                    this._model.loadMore(this._onEntitiesLoaded.bind(this), this._onNetworkError.bind(this)));
            }

            return this.busy();
        },

        entityExists: function (name, type) {
            return (this._findEntity(name, type) != null);
        },

        setFilter: function (filter) {
            this._filtering = true;
            this._model.setFilter(filter);
            this.openFolder(this.path());
        },

        setOrder: function (order) {
            this._ordering = true;
            if (this._order.by() == order) {
                var asc = !this._order.asc();
                this._order.asc(asc);
            } else {
                this._order.asc(true);
                this._order.by(order);
            }
            this._model.setOrder(this._order.by(), this._order.asc());
            this.openFolder(this.path());
        },

        orderBy: function () {
            return this._order.by();
        },

        orderAsc: function () {
            return this._order.asc();
        },

        findEntity: function (name, type) {
            return this._findEntity(name, type);
        }
    });
})(jQuery);