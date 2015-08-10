using System;
using System.Collections;
using System.IO;
using Groupdocs.Common;
using Groupdocs.Common.InstallableViewer;
using Groupdocs.Engine.Viewing;
using Groupdocs.Engine.Viewing.InstallableViewer;
using Groupdocs.Storage;

namespace Groupdocs.Web.UI
{
    public interface IViewingServiceCreator
    {
        IEditingService GetViewingService(string rootStoragePath, string workingFolder = null);

        IEditingService GetViewingService(SupportedStorageProvider storageProvider,
                                         string serviceHost, string apiKey, string apiSecretKey,
                                         string bucketName, string cacheBucketName,
                                         string rootStoragePath, string workingFolder = null);

        IEditingService GetViewingService(string rootStoragePath,
                                          IStorageProvider customStorageProvider,
                                          string workingDirectoryPath,
                                          IStorageProvider customWorkingStorageProvider);
    }

    public class ViewingServiceCreator : IViewingServiceCreator
    {
        private readonly string _rootStoragePath;
        private readonly string _downloadPath;
        private readonly IHelper _helper;

        public ViewingServiceCreator()
        {
            IRootPathFinder rootPathFinder = new RootPathFinder();
            _rootStoragePath = rootPathFinder.GetRootStoragePath();
            _downloadPath = Path.Combine(_rootStoragePath ?? String.Empty, Constants.DownloadDirectory, Constants.FromRemoteStorageDirectory);
            _helper = new Helper();
        }

        public IEditingService GetViewingService(string rootStoragePath, string workingFolder = null)
        {
            IStorageProvider customStorageProvider = _helper.GetCustomStorageProvider();
            IStorageProvider customTempStorageProvider = _helper.GetCustomTempStorageProvider();
            SupportedStorageProvider storageProvider = SupportedStorageProvider.Default;
            Hashtable options = null;
            if (customStorageProvider == null)
            {
                storageProvider = _helper.GetStorageProvider();

                System.Web.HttpContext context = System.Web.HttpContext.Current;
                if (context != null)
                {
                    object objectOptions = context.Application[Constants.StorageProviderOptions];
                    if (objectOptions != null)
                    {
                        options = (Hashtable) ((Hashtable) objectOptions).Clone();
                    }
                }
            }
            return GetViewingServiceForOptions(customStorageProvider, customTempStorageProvider, storageProvider, options, rootStoragePath, workingFolder);
        }

        public IEditingService GetViewingService(SupportedStorageProvider storageProvider,
            string serviceHost, string apiKey, string apiSecretKey,
            string bucketName, string cacheBucketName,
            string rootStoragePath, string workingFolder = null)
        {
            Hashtable options = new Hashtable();
            options[Constants.ApiKey] = apiKey;
            options[Constants.ApiSecretKey] = apiSecretKey;
            options[Groupdocs.Common.InstallableViewer.CommonConstants.BucketNameKey] = bucketName;
            options[Constants.ServiceHostKey] = serviceHost;
            options[Groupdocs.Common.InstallableViewer.CommonConstants.CacheFolderKey] = _downloadPath;
            options[Groupdocs.Common.InstallableViewer.CommonConstants.CacheBucketNameKey] = cacheBucketName;

            return GetViewingServiceForOptions(null, null, storageProvider, options, rootStoragePath, workingFolder);
        }

        
        public IEditingService GetViewingService(string rootStoragePath,
                                                 IStorageProvider customStorageProvider,
                                                 string workingDirectoryPath, 
                                                 IStorageProvider customWorkingStorageProvider)
        {
            IFileStorage adapter = new FileStorageAdapter(customStorageProvider);
            IFileStorage tempStorageAdapter = new FileStorageAdapter(customWorkingStorageProvider);
            IEditingService viewingService = new EditingService(rootStoragePath, adapter, workingDirectoryPath, tempStorageAdapter);
            return viewingService;
        }

        private IEditingService GetViewingServiceForOptions(IStorageProvider customStorageProvider,
                                                 IStorageProvider customTempStorageProvider,
                                                 SupportedStorageProvider storageProvider,
                                                 Hashtable options,
                                                 string rootStoragePath, string workingFolder)
        {
            IEditingService viewingService;
            if (customStorageProvider == null)
            {
                switch (storageProvider)
                {
                    case SupportedStorageProvider.Local:
                        viewingService = new EditingService(rootStoragePath, workingFolder);
                        break;
                    default:
                        object sourceBucketNameObject = null, cacheBucketNameObject = null;
                        string sourceBucketName = null, cacheBucketName = null;
                        if (options != null)
                        {
                            sourceBucketNameObject = options[CommonConstants.BucketNameKey];
                            if (sourceBucketNameObject != null)
                                sourceBucketName = (string) sourceBucketNameObject;

                            cacheBucketNameObject = options[CommonConstants.CacheBucketNameKey];
                            if (cacheBucketNameObject != null)
                            {
                                cacheBucketName = (string) cacheBucketNameObject;
                                options[CommonConstants.DownloadFolderForCacheStorageKey] = Path.Combine(_downloadPath,
                                                                                                         cacheBucketName);
                            }
                            options[CommonConstants.CacheFolderKey] = Path.Combine(_downloadPath, sourceBucketName);
                        }
                        viewingService = new EditingService(rootStoragePath, (byte) storageProvider, options,
                                                            cacheBucketName);
                        break;
                }
            }
            else
            {
                viewingService = GetViewingService(rootStoragePath, customStorageProvider, workingFolder, customTempStorageProvider);
            }
            return viewingService;
        }
    }
}
