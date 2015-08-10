using System;

namespace Groupdocs.Storage
{
    public class FileSystemEntity
    {
        public string Guid { get; set; }
        public string Name { get; set; }
        public long Size { get; set; }
        public bool IsDirectory { get; set; }
        public DateTime DateModified { get; set; }
    }
}
