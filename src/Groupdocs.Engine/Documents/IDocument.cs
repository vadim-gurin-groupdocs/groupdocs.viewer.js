using System;
using System.IO;
using System.Data;
using System.Drawing;

namespace Groupdocs.Engine.Documents
{
    using Groupdocs.Common;
    using Groupdocs.Engine.Documents.Savers;

    public partial interface IDocument : ICloneable, IDisposable, IProgressNotifier
    {
        bool Open(Stream content);
        bool Open(Stream content, FileType fileType, bool saveTempFile);
        bool Open(string path);
        bool SaveAs(string path, SaverOptions options = null);
        bool SaveAs(string path, FileType type, SaverOptions options = null);
        bool SaveAs(Stream outputStream, FileType type, SaverOptions options = null);
        bool SaveAs(DocumentStreamsBundle outputDocumentStreams, FileType type, SaverOptions options = null);

        IDocument MergeWith(params IDocument[] documents);

        void Print(string path);

        Size GetPageSize(int pageNumber);

        DocumentType Type { get; }
        FileType FileType { get; set; }
        string Path { get; }
        int PageCount { get; }

        Stream DocumentContents { get; }
    }
}
