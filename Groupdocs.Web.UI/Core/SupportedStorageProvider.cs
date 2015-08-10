using Groupdocs.Common.InstallableViewer;

namespace Groupdocs.Web.UI
{
    /// <summary>
    /// Contains the supported storage providers.
    /// </summary>
    public enum SupportedStorageProvider : byte
    {
        /// <summary>
        /// The local file system storage provider.
        /// </summary>
        Local = 0, //StorageProvider.Local,

        /// <summary>
        /// The Amazon S3 storage provider.
        /// </summary>
        AmazonS3 = 2, // StorageProvider.AmazonS3,

        /// <summary>
        /// The Windows Azure storage provider.
        /// </summary>
        Azure = 6, // StorageProvider.Azure,

        /// <summary>
        /// The default storage provider. It's equal to Local.
        /// </summary>
        Default = Local
    }
}
