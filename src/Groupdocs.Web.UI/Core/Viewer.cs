using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Groupdocs.Viewer.UI.DependencyResolution;
using StructureMap;
using Groupdocs.Web.UI;
using Groupdocs.Common.InstallableViewer;
using Groupdocs.Viewer.UI.Handlers;

namespace Groupdocs.Viewer.UI
{
    /// <summary>
    /// Viewer global settings
    /// </summary>
    public static class Viewer
    {
        private static readonly IApplicationPathFinder _applicationPathFinder;
        private static readonly IRootPathFinder _rootPathFinder;

        static Viewer()
        {
            _applicationPathFinder = new ApplicationPathFinder();
            _rootPathFinder = new RootPathFinder();
        }


        /// <summary>
        /// Initializes the ASP.NET MVC routes used by Viewer.
        /// </summary>
        public static void InitRoutes()
        {
            RouteCollection routes = RouteTable.Routes;
            if (routes == null)
            {
                throw new InvalidOperationException("Cannot obtain 'RouteTable.Routes' collection");
            }

            routes.MapRoute(
              null,
              "document-viewer/fonts/{name}",
              new { controller = "GroupdocsViewer", action = "GetFont" }
              );

            routes.MapRoute(
              null,
              "document-viewer/images/{name}",
              new { controller = "GroupdocsViewer", action = "GetEmbeddedImage" }
              );

            routes.MapRoute(
               null,
               "document-viewer/CSS/GetCss",
               new { controller = "GroupdocsViewer", action = "GetCss" }
               );

            routes.MapRoute(
               null,
               "document-viewer/GetPdfWithPrintDialog",
               new { controller = "GroupdocsViewer", action = "GetPdfWithPrintDialog" }
               );

            routes.MapRoute(
               null,
               "document-viewer/{action}",
               new { controller = "GroupdocsViewer" }
               );
        }


        /// <summary>
        /// Initializes the ASP.NET handlers routes used by Viewer.
        /// </summary>
        public static void InitAspNetRoutes()
        {
            RouteCollection routes = RouteTable.Routes;
            if (routes == null)
            {
                throw new InvalidOperationException("Cannot obtain 'RouteTable.Routes' collection");
            }

            routes.Add(null, new Route("document-viewer/ViewDocumentHandler",
               new ViewDocumentHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetDocumentPageImageHandler",
               new GetDocumentPageImageHandler()
            ));

            routes.Add(null, new Route("document-viewer/LoadFileBrowserTreeDataHandler",
               new LoadFileBrowserTreeDataHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetImageUrlsHandler",
               new GetImageUrlsHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetFileHandler",
               new GetFileHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetPdfWithPrintDialogHandler",
               new GetPdfWithPrintDialogHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetPrintableHtmlHandler",
               new GetPrintableHtmlHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetResourceForHtmlHandler",
               new GetResourceForHtmlHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetDocumentPageHtmlHandler",
               new GetDocumentPageHtmlHandler()
            ));

            routes.Add(null, new Route("document-viewer/ReorderPageHandler",
               new ReorderPageHandler()
            ));

            routes.Add(null, new Route("document-viewer/RotatePageHandler",
               new RotatePageHandler()
            ));
        }

        /// <summary>
        /// Sets the path to a license file.
        /// </summary>
        /// <param name="licensePath"></param>
        public static void SetLicensePath(string licensePath)
        {
            HttpContext context = HttpContext.Current;
            HttpApplicationState application = context.Application;
            application[Constants.GroupdocsLicensePathKey] = licensePath;
        }

        /// <summary>
        /// Sets the storage provider used by Viewer.
        /// </summary>
        /// <param name="storageProvider">A storage provider.</param>
        /// <param name="serviceHost">The URL of a host</param>
        /// <param name="apiKey">An API key.</param>
        /// <param name="apiSecretKey">A secret key.</param>
        /// <param name="bucketName">The name of a bucket.</param>
        /// <param name="cacheBucketName">The name of a bucket which holds the cache</param>
        public static void SetStorageProvider(SupportedStorageProvider storageProvider,
                                              string serviceHost, string apiKey, string apiSecretKey,
                                              string bucketName, string cacheBucketName)
        {
            HttpContext context = HttpContext.Current;
            if (context != null)
            {
                HttpApplicationState application = context.Application;
                application[Constants.StorageProvider] = storageProvider;
                Hashtable storageProviderOptions = new Hashtable();
                storageProviderOptions[Constants.ApiKey] = apiKey;
                storageProviderOptions[Constants.ApiSecretKey] = apiSecretKey;
                storageProviderOptions[CommonConstants.BucketNameKey] = bucketName;
                storageProviderOptions[Constants.ServiceHostKey] = serviceHost;
                storageProviderOptions[CommonConstants.CacheBucketNameKey] = cacheBucketName;
                application[Constants.StorageProviderOptions] = storageProviderOptions;
            }
        }

        /// <summary>
        /// Specifies custom storage providers used by Viewer to access files.
        /// </summary>
        /// <param name="storageProvider">An implementation of the IFileStorage interface used to access documents.</param>
        /// <param name="tempStorageProvider">An implementation of the IFileStorage interface used to access Viewer temporary files (page representations, document descriptions).</param>
        public static void SetStorageProvider(IStorageProvider storageProvider, IStorageProvider tempStorageProvider)
        {
            HttpContext context = HttpContext.Current;
            if (context != null)
            {
                HttpApplicationState application = context.Application;
                application[Constants.CustomStorageProvider] = storageProvider;
                application[Constants.CustomTempStorageProvider] = tempStorageProvider;
            }
        }

        /// <summary>
        /// Sets the path to a directory where you store your documents and the Viewer’s page cache
        /// </summary>
        /// <param name="rootStoragePath">The path to a directory which holds files to be shown</param>
        /// <param name="workingDirectoryPath">The path to a directory which holds working files</param>
        /// <param name="storePerRequest">If true, the root storage and working directory paths
        /// are stored separately for each request. Otherwise, the paths are shared between requests.</param>
        public static void SetRootStoragePath(string rootStoragePath, string workingDirectoryPath = null, bool storePerRequest = false)
        {
            HttpContext context = HttpContext.Current;
            if (context == null) // WinForms viewer
            {
                _rootPathFinder.RootStoragePath = rootStoragePath;
                _rootPathFinder.CachePath = workingDirectoryPath;
            }
            else
            {
                HttpApplicationState application = context.Application;
                if (storePerRequest)
                {
                    context.Items[Constants.GroupdocsRootStoragePath] = rootStoragePath;
                    context.Items[Constants.GroupdocsCachePath] = workingDirectoryPath;
                }
                else
                {
                    application[Constants.GroupdocsRootStoragePath] = rootStoragePath;
                    application[Constants.GroupdocsCachePath] = workingDirectoryPath;
                }
                application[Constants.SetPerRequest] = storePerRequest;
            }
        }

        /// <summary>
        /// Sets the path to a directory where you store your documents and the Viewer’s page cache, which are connected with the specific InstanceID
        /// </summary>
        /// <param name="rootStoragePath">Root storage path - path to a directory which holds files to be shown</param>
        /// <param name="workingDirectoryPath">Working directory path - path to a directory which holds working files. Can be omitted if NULL value is specified.</param>
        /// <param name="instanceId">InstanceID, which represents and identifies specified root storage and working directory paths</param>
        /// <exception cref="InvalidOperationException"></exception>
        /// <exception cref="ArgumentException"></exception>
        public static void SetRootStoragePath(string rootStoragePath, string workingDirectoryPath, string instanceId)
        {
            HttpContext context = HttpContext.Current;
            if (context == null)
            {//WCF or WinForms Viewer
                throw new InvalidOperationException("InstanceID is available only for the ASP.NET Viewer");
            }
            if (string.IsNullOrWhiteSpace(rootStoragePath) ||
                rootStoragePath.IndexOfAny(Path.GetInvalidPathChars()) != -1)
            {
                throw new ArgumentException("Root storage path is invalid", "rootStoragePath");
            }
            if (string.IsNullOrWhiteSpace(workingDirectoryPath))
            {
                workingDirectoryPath = null;
            }
            HttpApplicationState application = context.Application;
            Tuple<string, string> paths = new Tuple<string, string>(rootStoragePath, workingDirectoryPath);
            Object previousValue = application[Constants.InstanceIdContainerKey];
            if (previousValue == null)
            {
                Dictionary<string, Tuple<string, string>> data = new Dictionary<string, Tuple<string, string>>(1)
                {
                    {instanceId, paths}
                };
                application[Constants.InstanceIdContainerKey] = data;
            }
            else
            {
                Dictionary<string, Tuple<string, string>> previousValueCasted = (Dictionary<string, Tuple<string, string>>) previousValue;
                previousValueCasted[instanceId] = paths;
            }
        }


        /// <summary>
        /// Specifies the path to a log file where information about operatins and exceptions will be written to.
        /// </summary>
        /// <param name="logFilePath">A path.</param>
        public static void SetLogFilePath(string logFilePath)
        {
            HttpContext context = HttpContext.Current;
            if (context == null) // WinForms viewer
            {
                _rootPathFinder.LogFilePath = logFilePath;
            }
            else
            {
                HttpApplicationState application = context.Application;
                application[Constants.GroupdocsLogFilePath] = logFilePath;
            }
        }

        /// <summary>
        /// Disables the processing of the file list request for security reasons
        /// </summary>
        /// <param name="enable">If true, the processing of the file list request is enabled; otherwise it's disabled.</param>
        public static void EnableFileListRequestHandling(bool enable)
        {
            HttpApplicationState application = HttpContext.Current.Application;
            application[Constants.GroupdocsFileListRequestHandlingIsEnabled] = enable;
        }

        /// <summary>
        /// Disables the processing of document download requests for security reasons
        /// </summary>
        /// <param name="enable">
        /// If true, the processing of the document download request is enabled; otherwise it's disabled.
        /// </param>
        public static void EnableDownloadRequestHandling(bool enable)
        {
            HttpApplicationState application = HttpContext.Current.Application;
            application[Constants.GroupdocsDownloadRequestHandlingIsEnabled] = enable;
        }

        /// <summary>
        /// Disables the processing of document printing requests for security reasons
        /// </summary>
        /// <param name="enable">
        /// If true, the processing of the document printing request is enabled; otherwise it's disabled.
        /// </param>
        public static void EnablePrintRequestHandling(bool enable)
        {
            HttpApplicationState application = HttpContext.Current.Application;
            application[Constants.GroupdocsPrintRequestHandlingIsEnabled] = enable;
        }

        /// <summary>
        /// Specifies whether exception details are shown in the browser.
        /// </summary>
        /// <param name="show">If true, exception details are shown; otherwise they are not.</param>
        public static void ShowExceptionDetailsOnClient(bool show)
        {
            HttpApplicationState application = HttpContext.Current.Application;
            application[Constants.GroupdocsShowExceptionDetailsOnClient] = show;
        }

        /// <summary>
        /// Sets the base URL which will be used for referencing resources (images and fonts) by the HTML-based engine
        /// </summary>
        /// <param name="url"> A URL.</param>
        public static void SetBaseUrl(string url)
        {
            BaseUrl = url;
        }

        public static void InitDependencyInjection()
        {
            IContainer container = IoC.Initialize();
            DependencyResolver.SetResolver(new SmDependencyResolver(container));
        }


        /// <summary>
        /// 
        /// </summary>
        private static string BaseUrl
        {
            set
            {
                HttpContext context = HttpContext.Current;
                if (context == null) // WCF
                {
                    _applicationPathFinder.BaseUrl = value;
                }
                else
                {
                    HttpApplicationState application = HttpContext.Current.Application;
                    application[Constants.GroupdocsBaseUrl] = value;
                }
            }
            get
            {
                HttpContext context = HttpContext.Current;
                return (context == null ? _applicationPathFinder.BaseUrl : context.Application[Constants.GroupdocsBaseUrl] as string);
            }
        }
    }
}
