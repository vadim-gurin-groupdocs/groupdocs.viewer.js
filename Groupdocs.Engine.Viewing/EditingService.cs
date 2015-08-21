using System;
using System.Collections;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using Groupdocs.Common;
using Groupdocs.Engine.Documents;
using Groupdocs.Storage;
using Groupdocs.Threading;
using Groupdocs.Web.UI;

namespace Groupdocs.Engine.Viewing.InstallableViewer
{
    public interface IEditingService : IThirdPartyViewingService
    {
        void ReorderPage(string filePath, int oldPosition, int newPosition);
        int RotatePage(string path, int pageNumber, int rotationAmount, bool saveToCustomTempStorage);
    }

    public class EditingService: IEditingService
    {
        protected const string _imagesFolderTemplate = "{0}@{1}";
        protected const string _pageImageFileNameTemplate = "page_{0}.jpg";
        private const string _rootStorageFolder = @"d:\temp";
        string _baseCachePath = @"d:\temp\temp\Cache";

        public EditingService(string storageFolder, string workingFolder = null)
        {
        }

        public EditingService(string rootStoragePath, byte storageProvider, Hashtable storageProviderOptions, string cacheBucketName)
        {
        }

        public EditingService(string storageFolder, IFileStorage unwrappedStorage,
                              string workingFolder = null, IFileStorage tempStorage = null)
        {
        }


        public int GeneratePageImages(string filePath, ViewingOptions options, string outputFolder = null)
        {
            string modificationTimeString = GetModificationTimeString(filePath);
            //string pathToDirectoryWithConvertedFile = Path.Combine(_baseCachePath, filePath, modificationTimeString ?? String.Empty);
            string imageFolderPath = GetImagesFolder(filePath, 100, null, null, true);
            string fullImageFolderPath = Path.Combine(_baseCachePath, imageFolderPath);
            var files = Directory.EnumerateFiles(fullImageFolderPath, "*.jpg");
            return files.Count();
        }

        public string GetImagesFolder(string filePath, int? quality = null, int? width = null, int? height = null,
            bool usePdf = false)
        {
            string modificationTimeString = GetModificationTimeString(filePath, true);
            string path = Path.Combine(
                filePath, modificationTimeString ?? String.Empty,
                String.Format(_imagesFolderTemplate, quality, "x.Pdf"));
            return path;
        }

        protected string GetModificationTimeString(string filePath = null, bool checkFileDateTime = true,
                                                   bool ignoreDocumentAbsence = true)
        {
            DateTime? modificationDateTime = null;
            if (filePath != null)
            {
                if (!checkFileDateTime)
                    return null;

                string fullPath = Path.Combine(_rootStorageFolder, filePath);
                if (File.Exists(fullPath))
                {
                    modificationDateTime = File.GetLastWriteTimeUtc(fullPath);
                }
            }

            if (modificationDateTime == null)
                return null;

            string modificationTimeString =
                    modificationDateTime.Value.ToString("s", CultureInfo.InvariantCulture).Replace(':', '_');
            return modificationTimeString;
        }

        public string GetCachedImageFullPath(string documentPath, int pageIndex, bool usePdf, int? width = null,
            int? quality = null, int? height = null)
        {
            string imageFolderPath = GetImagesFolder(documentPath, quality, width, height, usePdf);
            string pageRelativePath = Path.Combine(imageFolderPath, String.Format(_pageImageFileNameTemplate, pageIndex));
            string fullImagePath = Path.Combine(_baseCachePath, pageRelativePath);
            return fullImagePath;
        }

        public byte[] GetCachedImage(string documentPath, int pageIndex, int? width = null,
            int? quality = null, int? height = null, bool usePdf = false,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
            float watermarkWidth = 0,
            bool useHtmlBasedEngine = false,
            bool supportPageRotation = false)
        {
            string fullPath = GetCachedImageFullPath(documentPath, pageIndex, true, null, 100, null);
            using (new InterProcessLock(fullPath))
            {
                using (Stream imageStream = File.OpenRead(fullPath))
                {
                    using (MemoryStream imageMemoryStream = new MemoryStream())
                    {
                        imageStream.CopyTo(imageMemoryStream);
                        return imageMemoryStream.ToArray();
                    }
                }
            }
        }

        public string GenerateJavaScriptDescription(string filePath,
            string databaseGuid,
            bool checkFileDateTime = true,
            bool descForHtmlBasedEngine = false,
            bool descForImageBasedEngineWithoutTextSelection = false,
            bool saveToCustomTempStorage = false,
            bool returnConttents = false,
            bool supportListOfContentControls = false,
            bool supportListOfBookmarks = false,
            ProgressDelegate progressCallback = null, IDocument openedDocument = null, int? quality = null)
        {
            string modificationTimeString = GetModificationTimeString(filePath, true);
            string path = Path.Combine(filePath, modificationTimeString ?? String.Empty, "desc" + (descForHtmlBasedEngine ? "_htmlEngine" : "") + ".js");
            string fullPath = Path.Combine(@"d:\temp\temp\Processing", path);
            return File.ReadAllText(fullPath);
            //return "{\"pages\":[{\"w\":595.32,\"h\":841.92,\"number\":1},{\"w\":595.32,\"h\":841.92,\"number\":2}],\"maxPageHeight\":841.92,\"widthForMaxHeight\":595.32}";
        }

        public IDocument GetPdf(Stream fileContents, string fileExtension, string pathToResultPdf)
        {
            throw new NotImplementedException();
        }

        public Stream MergePdfDocuments(ICollection<IDocument> documents)
        {
            throw new NotImplementedException();
        }

        public string GetPdfWithPrintDialog(string filePath)
        {
            throw new NotImplementedException();
        }

        public int GetPageCount(string filePath, bool keepDocumentOpen, bool storePdfToCache, bool isLicensed)
        {
            throw new NotImplementedException();
        }

        public string GetProcessingFolderFullPath()
        {
            throw new NotImplementedException();
        }

        public Size GetPageSize(string filePath, bool usePdf, int? width = null, int? quality = null)
        {
            throw new NotImplementedException();
        }

        public byte[] GetPdfFile(string filePath, int countOfPagesToLeave, bool isPrintable, string watermarkText = null,
            int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
            float watermarkSizeInPercent = 0,
            bool ignoreDocumentAbsence = false,
            bool useHtmlBasedEngine = false,
            bool supportPageRotation = false,
            bool supportPageReordering = false)
        {
            throw new NotImplementedException();
        }

        public byte[] GetPdfVersionCacheEnabled(string filePath, int countOfPagesToLeave,
            bool isPrintable,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkSizeInPercent = 0,
            bool ignoreDocumentAbsence = false,
            bool useHtmlBasedEngine = false,
            bool supportPageRotation = false, bool supportPageReordering = false)
        {
            throw new NotImplementedException();
        }

        public void GeneratePdfVersionOfDocument(String filePath, bool isLicensed,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0)
        {
            throw new NotImplementedException();
        }

        public Stream GenerateOnePageImageFromDocument(string filePath, int pageNumber, int? quality, bool isLicensed,
            bool storeToCache)
        {
            throw new NotImplementedException();
        }

        public IFileStorage GetStorage()
        {
            throw new NotImplementedException();
        }

        public IFileStorage GetCacheStorage()
        {
            throw new NotImplementedException();
        }

        public IFileStorage GetTempStorage()
        {
            throw new NotImplementedException();
        }

        public string GetCacheRootFolder()
        {
            throw new NotImplementedException();
        }

        public void CloseDocument()
        {
            throw new NotImplementedException();
        }


        public int GenerateHtml(string filePath, Func<string, string> htmlWithImageCreator,
            string prefixForResourceUrlsInHtml,
            string prefixForResourceUrlsInHtmlFiles,
            int? firstPage, int? pageCount,
            bool generatePagesToEndOfDocument,
            bool usePngImagesForHtmlBasedEngine,
            bool convertWordDocumentsCompletely,
            bool ignoreDocumentAbsence,
            bool saveToCustomTempStorage,
            bool supportListOfContentControls,
            bool supportListOfBookmarks,
            bool embedImagesIntoHtmlForWordFiles)
        {
            string modificationTimeString = GetModificationTimeString(filePath);
            string pathToDirectoryWithConvertedFile = Path.Combine(_baseCachePath, filePath, modificationTimeString ?? String.Empty);

            var files = Directory.EnumerateFiles(pathToDirectoryWithConvertedFile, "*.html");
            return files.Count();
        }

        public void GetPagesHtml(string filePath, int startPageIndex, int pageCount, out string[] pageHtml,
            out string[] pageCss)
        {
            string basePath = @"d:\temp\temp\Cache";
            pageHtml = new string[pageCount];
            pageCss = new string[pageCount];

            string modificationTimeString = GetModificationTimeString(filePath);
            string pathToDirectoryWithConvertedFile = Path.Combine(basePath, filePath, modificationTimeString ?? String.Empty);

            for (int i = 0; i < pageCount; i++)
            {
                string fullPathToHtml = Path.Combine(pathToDirectoryWithConvertedFile, String.Format("p{0}.html", startPageIndex + i));
                string htmlPageContents;
                using (new InterProcessLock(fullPathToHtml))
                {
                    htmlPageContents = File.ReadAllText(fullPathToHtml);
                    pageHtml[i] = htmlPageContents;
                }

                string pathToCssDir = Path.Combine(pathToDirectoryWithConvertedFile, String.Format("p{0}_files", startPageIndex + i));
                string pathToCss = Path.Combine(pathToCssDir, "style.css");
                string cssPageContents = null;
                using (new InterProcessLock(fullPathToHtml))
                {
                    if (File.Exists(pathToCss))
                    {
                        cssPageContents = File.ReadAllText(pathToCss);
                    }
                    pageCss[i] = cssPageContents;
                }
            }
        }

        public byte[] GetResourceForHtml(string documentPath,
                                         string resourcePath,
                                         DateTime? clientModifiedSince,
                                         out bool isModified,
                                         out DateTime? fileModificationDateTime,
                                         bool relativeToOriginal)
        {
            string basePath = @"d:\temp\temp\Cache";
            DateTime? lastModificationTime = null;
            byte[] resourceContents = null;
            isModified = true;
            fileModificationDateTime = null;
            if (relativeToOriginal)
            {
                string documentDirPath = Path.GetDirectoryName(documentPath);
                string resourcePathInStorage = Path.Combine(documentDirPath, resourcePath);

                if (File.Exists(resourcePathInStorage))
                {
                    resourceContents = Encoding.UTF8.GetBytes(File.ReadAllText(resourcePathInStorage));
                }
                return resourceContents;
            }

            string modificationTimeString = GetModificationTimeString(documentPath);
            string pathToDirectoryWithConvertedFile = Path.Combine(basePath, documentPath, modificationTimeString ?? String.Empty);
            string pathToResource = Path.Combine(pathToDirectoryWithConvertedFile, resourcePath);

            using (new InterProcessLock(pathToResource))
            {
                if (File.Exists(pathToResource))
                {
                    resourceContents = File.ReadAllBytes(pathToResource);
                }
            }
            return resourceContents;
        }

        public string GetPagesSharedCss(string filePath)
        {
            return null;
        }


        public string[] GetPageImageUrlsOnThirdPartyStorage(string path, int pageCount, int? quality, int? width,
            int? height, bool usePdf)
        {
            throw new NotImplementedException();
        }


        public void ReorderPage(string filePath, int oldPosition, int newPosition)
        {
            throw new NotImplementedException();
        }

        public int RotatePage(string path, int pageNumber, int rotationAmount, bool saveToCustomTempStorage)
        {
            throw new NotImplementedException();
        }
    }
}
