(function ($, undefined) {
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
            return new explorerViewModel(
                this._getViewModelOptions());
        },

        _getViewModelOptions: function () {
            return {
                userId: this.options.userId,
                userKey: this.options.privateKey,
                pageSize: this.options.pageSize,
                fileTypes: this.options.fileTypes,
                startupPath: this.options.startupPath,
                view: this.options.view,
                urlHashEnabled: this.options.urlHashEnabled,
                instanceIdToken: this.options.instanceIdToken,
                bindingProvider: this.options.bindingProvider
            };
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
    explorerModel = function (options) {
        $.extend(this.options, options);
        this._init();
    };

    $.extend(explorerModel.prototype, {
        _portalService: Container.Resolve("PortalService"),
        _path: '',
        _entitiesLoaded: 0,
        _entitiesTotal: 0,
        _filter: {
            name: '',
            types: null
        },
        _order: null,
        options: {
            userId: '',
            userKey: '',
            pageSize: 30,
            extended: false
        },

        _init: function () {
            this.bindingProvider = this.options.bindingProvider;
            this._order = {
                by: this.bindingProvider.getObservable('Name'),
                asc: this.bindingProvider.getObservable(true)
            };
        },

        _loadPage: function (index, path, callback, errorCallback) {
            this._portalService.loadFileBrowserTreeData(this.options.userId, this.options.userKey, path,
                    index ? index : 0, this.options.pageSize,
                    this._order.by(), this._order.asc(),
                    this._filter.name, this._filter.types, this.options.extended,
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
                    } .bind(this),
                    false,
                    this.options.instanceIdToken
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

        createFolder: function (path, callback, errorCallback) {
            this._portalService.createFolderAsync(this.options.userId, this.options.userKey, path,
                function (response) {
                    if (response.data > 0) {
                        callback.apply(this, [path, response.data]);
                    }
                    else {
                        errorCallback.apply(this, [path, null, response.data]);
                    }
                } .bind(this),
                function (error) {
                    errorCallback.apply(this, [error, path]);
                } .bind(this)
            ).Subscribe();
        },

        setFilter: function (filter) {
            this._filter.name = filter.name;
            this._filter.types = filter.types;
        },

        setOrder: function (order) {
            if (this._order.by() == order) {
                var asc = !this._order.asc();
                this._order.asc(asc);
            } else {
                this._order.asc(true);
                this._order.by(order);
            }
        }
    });

    // File explorer view model
    explorerViewModel = function (options) {
        this._init(options);
    };

    $.extend(explorerViewModel.prototype, {
        _model: null,
        _filtering: false,
        _ordering: false,
        _userId: null,
        _userKey: null,
        urlHashEnabled: true,
        busy: null,
        path: null,
        entities: null,
        files: null,
        folders: null,
        changedUrlHash: false,
        view: null,

        _init: function (options) {
            this._model = this._createModel(options);
            this._userId = options.userId;
            this._userKey = options.userKey;
            this.bindingProvider = options.bindingProvider;
            if (typeof(options.urlHashEnabled) != 'undefined') {
                this.urlHashEnabled = options.urlHashEnabled;
            }
            this.busy = this.bindingProvider.getObservable(false);
            this.path = this.bindingProvider.getObservable('');
            this.entities = this.bindingProvider.getObservableArray();
            this.files = this.bindingProvider.getObservableArray();
            this.folders = this.bindingProvider.getObservableArray();
            this.view = this.bindingProvider.getObservable('listing');

            this.path = this.bindingProvider.getObservable('');
            this.entities = this.bindingProvider.getObservableArray();

            this.files = this.bindingProvider.getObservableArray();
            this.folders = this.bindingProvider.getObservableArray();

            var self = this;
            this.isNotRootFolder = this.bindingProvider.getComputedObservable(
                function () {
                    return !(self.path() === '');
                });
            if (!options.skipStartupPathLoad)
                this.openFolder(options.startupPath);
        },

        _createModel: function (options) {
            return new explorerModel(options);
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

            $.each(entities, function (i) {                
                if (!this.extended) {
                    var e = this;
                    self._extendEntity(e);
                    self.entities.push(e);
                }

                if (this.type == 'file') {
                    self.files.push(this);
                }
                else {
                    self.folders.push(this);
                }
            });

            self._filtering = false;
            self._ordering = false;
            self.path(path);
            if (this.urlHashEnabled) {
                this.changedUrlHash = true;
                location.hash = self.view() + '#' + path;
                this.changedUrlHash = false;
            }
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
                uploading: self.bindingProvider.getObservable(false),
                isNewVersion:false,
                processingOnServer:false,
                sizeInKb: self.bindingProvider.getObservable(Math.round(entity.size / 1024)),
                docType: self.bindingProvider.getObservable((entity && entity.docType) ? entity.docType.toLowerCase() : ""),
                modifiedOn: function () { return (isNaN(entity.modifyTime) || entity.modifyTime < 0 ? '---' : new Date(entity.modifyTime).format('mmm dd, yyyy')); },
                percentCompleted: self.bindingProvider.getObservable(0),
                uploadSpeed: self.bindingProvider.getObservable(0),
                remainingTime: self.bindingProvider.getObservable(0),
                supportedTypes: self.bindingProvider.getObservableArray(supportedTypes),
                thumbnail: self.bindingProvider.getObservable(entity.thumbnail),
                selected: self.bindingProvider.getObservable(false),
                isVisible: self.bindingProvider.getObservable(true),
                viewJobId: self.bindingProvider.getObservable(null),
                viewJobPoller: null
            });

            entity.statusText = this.bindingProvider.getComputedObservable(function () {
                return (entity.viewJobId() && entity.viewJobId() > 0 ?
                    'Server-side processing ...' :
                    'Time remaining: ' + entity.remainingTime() + ' secs @ ' + entity.uploadSpeed() + ' kb/Sec.');
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

        createFile: function (name, size) {
            var existingEntity = this._findEntity(name, 'file');
            if (existingEntity) {
                existingEntity.uploading(true);
                existingEntity.isNewVersion = true;
                return existingEntity;
            }

            var self = this;
            var entity = this._createEntity(name, 'file', size);

            entity.uploading(true);
            entity.isNewVersion = false;

            this.entities.push(entity);
            this.files.unshift(entity);

            return entity;
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
            this._model.setOrder(order);
            this.openFolder(this.path());
        },

        orderBy: function () {
            return this._model._order.by();
        },

        orderAsc: function () {
            return this._model._order.asc();
        },

        findEntity: function (name, type) {
            return this._findEntity(name, type);
        },
        
        isNullOrWhiteSpace: function (str){
        	return str === null || str == 'undefined' || str.match(/^ *$/) !== null;
		}
    });
})(jQuery);