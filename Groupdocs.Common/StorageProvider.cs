using System;

namespace Groupdocs.Common
{
    public enum StorageProvider : byte
    {
        Local,
        Groupdocs = Local,
        Banckle,
        AmazonS3,
        Dropbox,
        Http,
        GoogleDrive,
        Azure,
        BoxNet,
        GoogleCloud,
        LongPathLocal,

        Default = Local
    }
}
