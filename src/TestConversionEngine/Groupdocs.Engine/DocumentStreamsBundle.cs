using System;
using System.Collections.Generic;
using System.IO;
using Groupdocs.Common;

namespace Groupdocs.Engine
{
    public class DocumentStreamsBundle:IDisposable
    {
        public class StreamItemsList<T> : List<StreamItem>
        {
            private bool _isModified;
            private readonly bool _isSingleItem;
            public StreamItemsList()
            {
            }
            internal StreamItemsList(StreamItem item, bool isSingleStream)
            {
                _isSingleItem = isSingleStream;
                base.Add(item);
            }
            public new void Add(StreamItem item)
            {
                item.Stream.Position = 0;
                if (_isSingleItem)
                {
                    const string multiStreamNotSupportedErrMessage =
                        "DocumentStreamsBundle initialized with isSingleItem param set to true is for compatibility with old code for signle stream output. Please init the DocumentStreamsBundle without isSingleItem parameter and handle multiple streams result in your code. This error occur usually when Document.SaveAs method was invoked with Stream for result instead with DocumentStreamsBundle.";
                    switch (Count)
                    {
                        case 1:
                            if (_isModified)
                                throw new InvalidOperationException(multiStreamNotSupportedErrMessage);
                            base[0].Stream.SetLength(0);
                            item.Stream.CopyTo(base[0].Stream);
                            base[0].FileType = item.FileType;
                            break;
                        case 0:
                            base.Add(item);
                            break;
                        default:
                            throw new InvalidOperationException(multiStreamNotSupportedErrMessage);
                    }
                }
                else                
                    base.Add(item);
                _isModified = true;
            }
        }
        public StreamItemsList<StreamItem> StreamItems { get; set; }

        public DocumentStreamsBundle()
        {
            StreamItems = new StreamItemsList<StreamItem>();
        }
        public DocumentStreamsBundle(Stream stream,FileType fileType)
        {
            StreamItems = new StreamItemsList<StreamItem>() { new StreamItem(stream, fileType) };
        }
        public DocumentStreamsBundle(Stream stream, FileType fileType, bool isSingleItem)
        {
            StreamItems = new StreamItemsList<StreamItem>(new StreamItem(stream, fileType),isSingleItem);
        }
        public void Dispose()
        {
            StreamItems.ForEach(item => item.Stream.Dispose());
        }

        public Stream[] ToArray()
        {
            var result = new Stream[StreamItems.Count];
            for (int i = 0; i < StreamItems.Count; i++)
                result[i] = StreamItems[i].Stream;
            return result;
        }

        public class StreamItem
        {
            public FileType FileType { get; set; }
            public Stream Stream { get; set; }
            public string SupposedFileName { get; set; }

            public StreamItem(Stream stream, FileType fileType, string supposedFileName = null)
            {
                FileType = fileType;
                Stream = stream;
                SupposedFileName = supposedFileName;
            }
        }
    }
}
