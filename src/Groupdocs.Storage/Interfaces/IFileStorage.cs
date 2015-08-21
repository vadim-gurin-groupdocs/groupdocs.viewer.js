using System;
using System.IO;
using Groupdocs.Common;

namespace Groupdocs.Storage
{
    public interface IFileStorage
    {
        #region File Operations

        string AddFile(string path, Stream content);
        string AddFile(string path, string localPath);

        bool RenameFile(string path, string newName);
        bool RemoveFile(string path);

        bool FileExists(string path);
        Stream GetFile(string path);
        Stream CreateFile(string path);
        string MapFilePath(string path);
        string GetFileName(string path);
        string GetFileVirtualPath(string path);
        DateTime GetFileDateTime(string path);

        string CopyFile(string fromPath, string toPath);
        string MoveFile(string fromPath, string toPath);

        #endregion File Operations

        #region Folder Operations

        string CreateFolder(string path);
        bool DeleteFolder(string path);
        bool FolderExists(string path);
        bool CopyFolder(string fromPath, string toPath, bool deep = true);
        bool MoveFolder(string fromPath, string toPath, bool deep = true);

        #endregion Folder Operations

        #region Other Operations

        FileSystemEntity[] ListEntities(string path);

        string RootFolder { get; set; }
        StorageProvider Provider { get; }

        #endregion

        bool RemoveLastFileVersion(string filePath);
    }
}
