using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Groupdocs.Common;
using Groupdocs.Common.InstallableViewer;
using Groupdocs.Storage;

namespace Groupdocs.Web.UI
{
    /// <summary>
    /// Represents a storage provider which allows to work with some file storage.
    /// </summary>
    public interface IStorageProvider
    {
        #region File Operations

        /// <summary>
        /// Adds file contents to the storage.
        /// </summary>
        /// <param name="path">The relative path in the storage to a file to be created.</param>
        /// <param name="content">File contents.</param>
        /// <returns></returns>
        string AddFile(string path, Stream content);

        /// <summary>
        /// Adds file contents to the storage.
        /// </summary>
        /// <param name="path">The relative path in the storage to a file to be created.</param>
        /// <param name="localPath">The absolute path to a file to read data from.</param>
        /// <returns></returns>
        string AddFile(string path, string localPath);

        /// <summary>
        /// Deletes a file.
        /// </summary>
        /// <param name="path">The relative path in the storage to a file to be deleted.</param>
        /// <returns>true if the operation succeeded, false otherwise.</returns>
        bool DeleteFile(string path);

        /// <summary>
        /// Checks if a file exists.
        /// </summary>
        /// <param name="path">The relative path in the storage to a file.</param>
        /// <returns>true if a specified file exists, false otherwise.</returns>
        bool FileExists(string path);

        /// <summary>
        /// Returns file contents.
        /// </summary>
        /// <param name="path">The relative path in the storage to a file.</param>
        /// <returns>File contents.</returns>
        Stream GetFile(string path);

        /// <summary>
        /// Gets the full path to a file.
        /// </summary>
        /// <param name="path">The relative path in the storage to a file.</param>
        /// <returns>The full path to a file</returns>
        string MapFilePath(string path);

        /// <summary>
        /// Gets the file name from a path.
        /// </summary>
        /// <param name="path">The relative path in the storage to a file.</param>
        /// <returns>The file name.</returns>
        string GetFileName(string path);

        /// <summary>
        /// Gets the provider-specific virtual path of a file.
        /// </summary>
        /// <param name="path">The relative path to a file in the storage.</param>
        /// <returns>The virtual path of a file.</returns>
        string GetFileVirtualPath(string path);

        /// <summary>
        /// Gets the UTC date and time of the last modification of a file.
        /// </summary>
        /// <param name="path">The relative path to a file in the storage.</param>
        /// <returns>The UTC date and time.</returns>
        DateTime GetFileDateTime(string path);

        /// <summary>
        /// Copies a file.
        /// </summary>
        /// <param name="fromPath">The path of a source file.</param>
        /// <param name="toPath">The path of a destination file.</param>
        /// <returns></returns>
        string CopyFile(string fromPath, string toPath);

        /// <summary>
        /// Moves a file.
        /// </summary>
        /// <param name="fromPath">The path of a source file.</param>
        /// <param name="toPath">The path of a destination file.</param>
        /// <returns></returns>
        string MoveFile(string fromPath, string toPath);

        #endregion File Operations

        #region Folder Operations

        /// <summary>
        /// Creates a folder.
        /// </summary>
        /// <param name="path">The relative path to a folder in the storage.</param>
        /// <returns></returns>
        string CreateFolder(string path);

        /// <summary>
        /// Deletes a folder.
        /// </summary>
        /// <param name="path">The relative path to a folder in the storage.</param>
        /// <returns>true if the operation succeeded, false otherwise.</returns>
        bool DeleteFolder(string path);

        /// <summary>
        /// Checks if a folder exists.
        /// </summary>
        /// <param name="path">The relative path to a folder in the storage.</param>
        /// <returns>true if a specified folder exists, false otherwise.</returns>
        bool FolderExists(string path);

        /// <summary>
        /// Copies a folder.
        /// </summary>
        /// <param name="fromPath">The relative path to a source folder in the storage.</param>
        /// <param name="toPath">The relative path to a destination folder in the storage.</param>
        /// <param name="deep">If true, all the subdirectories are copied. 
        /// Otherwise, only file system entities in the directry itself are copied.</param>
        /// <returns>true if the operation succeeded, false otherwise.</returns>
        bool CopyFolder(string fromPath, string toPath, bool deep = true);

        /// <summary>
        /// Moves a folder.
        /// </summary>
        /// <param name="fromPath">The relative path to a source folder in the storage.</param>
        /// <param name="toPath">The relative path to a destination folder in the storage.</param>
        /// <param name="deep">If true, all the subdirectories are copied. 
        /// Otherwise, only file system entities in the directry itself are moved.</param>
        /// <returns>true if the operation succeeded, false otherwise.</returns>
        bool MoveFolder(string fromPath, string toPath, bool deep = true);

        #endregion Folder Operations

        #region Other Operations

        /// <summary>
        /// Lists all the entities in a folder.
        /// </summary>
        /// <param name="path">The relative path to a folder in the storage.</param>
        /// <returns>A list of files and folders.</returns>
        FileSystemEntity[] ListEntities(string path);

        #endregion
    }

    public class FileStorageAdapter : IFileStorage
    {
        private IStorageProvider _storage;

        public FileStorageAdapter(IStorageProvider storage)
        {
            _storage = storage;
        }

        public string AddFile(string path, Stream content)
        {
            return _storage.AddFile(path, content);
        }

        public string AddFile(string path, string localPath)
        {
            return _storage.AddFile(path, localPath);
        }

        public bool RemoveFile(string path)
        {
            return _storage.DeleteFile(path);
        }

        public bool FileExists(string path)
        {
            return _storage.FileExists(path);
        }

        public Stream GetFile(string path)
        {
            return _storage.GetFile(path);
        }
        
        public string MapFilePath(string path)
        {
            return _storage.MapFilePath(path);
        }

        public string GetFileName(string path)
        {
            return _storage.GetFileName(path);
        }

        public string GetFileVirtualPath(string path)
        {
            return _storage.GetFileVirtualPath(path);
        }

        public DateTime GetFileDateTime(string path)
        {
            return _storage.GetFileDateTime(path);
        }

        public string CopyFile(string fromPath, string toPath)
        {
            return _storage.CopyFile(fromPath, toPath);
        }

        public string MoveFile(string fromPath, string toPath)
        {
            return _storage.MoveFile(fromPath, toPath);
        }

        public string CreateFolder(string path)
        {
            return _storage.CreateFolder(path);
        }

        public bool DeleteFolder(string path)
        {
            return _storage.DeleteFolder(path);
        }

        public bool FolderExists(string path)
        {
            return _storage.FolderExists(path);
        }

        public bool CopyFolder(string fromPath, string toPath, bool deep = true)
        {
            return _storage.CopyFolder(fromPath, toPath, deep);
        }

        public bool MoveFolder(string fromPath, string toPath, bool deep = true)
        {
            return _storage.CopyFolder(fromPath, toPath, deep);
        }

        public FileSystemEntity[] ListEntities(string path)
        {
            return _storage.ListEntities(path);
        }

        #region Not implemented
        public bool RenameFile(string path, string newName)
        {
            throw new NotImplementedException();
        }

        public Stream CreateFile(string path)
        {
            throw new NotImplementedException();
        }

        public bool RemoveLastFileVersion(string filePath)
        {
            throw new NotImplementedException();
        }

        public string RootFolder { get; set; }
        public Groupdocs.Common.StorageProvider Provider { get; private set; }
        #endregion Not implemented
    }
}
