using System;

namespace Groupdocs.Web.UI
{
    public static class Constants
    {
        public const string JqueryFileDownloadCookieName = "jqueryFileDownloadJSForGD";
        public const string GroupdocsLicensePathKey = "GroupdocsLicensePath";
        public const string GroupdocsLicenseStreamKey = "GroupdocsLicenseStreamKey";
        public const string GroupdocsRootStoragePath = "GroupdocsRootStoragePath";
        public const string GroupdocsFileListRequestHandlingIsEnabled = "GroupdocsFileListRequestHandlingIsEnabled";
        public const string GroupdocsDownloadRequestHandlingIsEnabled = "GroupdocsDownloadRequestHandlingIsEnabled";
        public const string GroupdocsPrintRequestHandlingIsEnabled = "GroupdocsPrintRequestHandlingIsEnabled";
        public const string GroupdocsReorderPageRequestHandlingIsEnabled = "GroupdocsReorderPageRequestHandlingIsEnabled";
        public const string GroupdocsCachePath = "GroupdocsCachePath";
        public const string GroupdocsBaseUrl = "GroupdocsBaseUrl";
        public const string DownloadDirectory = "temp";
        public const string FromStreamDirectory = "S";
        public const string FromRemoteStorageDirectory = "FromRemote";
        public const string StorageProvider = "StorageProvider";
        public const string CustomStorageProvider = "CustomStorageProvider";
        public const string CustomTempStorageProvider = "CustomTempStorageProvider";
        public const string StorageProviderOptions = "StorageProviderOptions";
        public const string FromUrlFolder = "FromURL";
        public const string SetPerRequest = "SetPerRequest";

        public const string ApiKey = "ApiKey";
        public const string ApiSecretKey = "ApiSecret";
        public const string StorageTypeKey = "StorageType";
        public const string StorageModeKey = "StorageMode";
        public const string ServiceHostKey = "ServiceHost";

        public const string GroupdocsLogFilePath = "GroupdocsLogFilePath";
        public const string GroupdocsEventSubscriptions = "GroupdocsEventSubscriptions";

        public const string GroupdocsShowExceptionDetailsOnClient = "GroupdocsShowExceptionDetailsOnClient";

        /// <summary>
        /// String key, which points to the container (Dictionary) with all Viewer InstanceIDs
        /// </summary>
        public const string InstanceIdContainerKey = "InstanceIdContainer";

        /// <summary>
        /// String key, which identifies the 'instanceId' value in the HTTP-request data
        /// </summary>
        /// <remarks>'instanceIdToken' value is used, because 'instanceId' is already present in the JS widget and has another meaning and responsibility</remarks>
        public const string InstanceIdRequestKey = "instanceIdToken";

        public static readonly DateTime Epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    }
}
