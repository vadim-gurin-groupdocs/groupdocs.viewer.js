using System;

namespace Groupdocs.Storage
{
    public class FileStorageException : Exception
    {
        public FileStorageException(string errorMessage)
            : base(errorMessage)
        {
        }

        public FileStorageException(string errorMessage, Exception innerException)
            : base(errorMessage, innerException)
        {
        }
    }
}
