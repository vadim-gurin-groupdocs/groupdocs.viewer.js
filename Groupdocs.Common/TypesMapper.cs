using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Xml;
using System.Xml.Linq;
using System.IO;

namespace Groupdocs.Common
{
    public static class TypesMapper
    {
        private static readonly Dictionary<DocumentType, FileType[]> _doc2fileTypes;
        private static readonly Dictionary<DocumentType, FileType[]> _doc2allTypes;
        private static readonly Dictionary<DocumentType, FileTypeInfo[]> _doc2typesInfo;
        private static readonly Dictionary<DocumentType, FileType[]> _doc2customTypes;

        static TypesMapper()
        {
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("Groupdocs.Common.Documents.Net.xml"))
            using (XmlReader reader = new XmlTextReader(stream))
            {
                XDocument xml = XDocument.Load(reader);
                var type = XName.Get("type");
                var name = XName.Get("name");
                var origin = XName.Get("origin");
                var native = XName.Get("NativeTypes");
                var custom = XName.Get("CustomTypes");
                //var foreign = XName.Get("ForeignTypes"); 
                
                var nativeTypes = (from x in xml.Root.Elements(XName.Get("Document"))
                                   select new KeyValuePair<DocumentType, FileType[]>(
                                       (DocumentType) Enum.Parse(typeof(DocumentType), x.Attribute(type).Value),
                                       (from y in x.Elements(native).Descendants()
                                        select (FileType) Enum.Parse(typeof(FileType), y.Attribute(name).Value)).ToArray())
                                   ).ToArray();

                var allTypes = (from x in xml.Root.Elements(XName.Get("Document"))
                                select new KeyValuePair<DocumentType, FileTypeInfo[]>(
                                    (DocumentType) Enum.Parse(typeof(DocumentType), x.Attribute(type).Value),
                                    (from y in x.Descendants().Elements("Type")
                                     select new FileTypeInfo
                                     {
                                         Type = (FileType) Enum.Parse(typeof(FileType), y.Attribute(name).Value),
                                         Origin = (y.Attribute(origin) != null ? y.Attribute(origin).Value : null)
                                     }).ToArray())
                                   ).ToArray();

                var customTypes = (from x in xml.Root.Elements(XName.Get("Document"))
                                   select new KeyValuePair<DocumentType, FileType[]>(
                                       (DocumentType)Enum.Parse(typeof(DocumentType), x.Attribute(type).Value),
                                       (from y in x.Elements(custom).Descendants()
                                        select (FileType)Enum.Parse(typeof(FileType), y.Attribute(name).Value)).ToArray())
                                   ).ToArray();

                _doc2fileTypes = new Dictionary<DocumentType, FileType[]>();
                Array.ForEach<KeyValuePair<DocumentType, FileType[]>>(nativeTypes, kvp => _doc2fileTypes.Add(kvp.Key, kvp.Value));

                _doc2allTypes = new Dictionary<DocumentType, FileType[]>();
                Array.ForEach<KeyValuePair<DocumentType, FileTypeInfo[]>>(allTypes, kvp => _doc2allTypes.Add(kvp.Key, Array.ConvertAll<FileTypeInfo, FileType>(kvp.Value, ti => ti.Type)));

                _doc2customTypes = new Dictionary<DocumentType, FileType[]>();
                Array.ForEach<KeyValuePair<DocumentType, FileType[]>>(customTypes, kvp => _doc2customTypes.Add(kvp.Key, kvp.Value));

                _doc2typesInfo = new Dictionary<DocumentType, FileTypeInfo[]>();
                Array.ForEach<KeyValuePair<DocumentType, FileTypeInfo[]>>(allTypes, kvp => _doc2typesInfo.Add(kvp.Key, kvp.Value));
            }
        }

        public static FileType[] GetFileTypesByExt(string extension)
        {
            FileType t = GetFileType(extension);
            return GetFileTypes(t);
        }

        public static FileType[] GetFileTypes(string nativeType)
        {
            FileType t = GetFileType(nativeType);
            return GetFileTypes(t);
        }

        public static FileType[] GetFileTypes(FileType nativeType)
        {
            var keys = from k in _doc2fileTypes.Keys
                       where _doc2fileTypes[k].Any(v => v == nativeType)
                       select k;
            var query = _doc2allTypes
                .Where(kvp => keys.Contains(kvp.Key))
                .Select(kvp => kvp.Value);

            IEnumerable<FileType> result = new List<FileType>();
            Array.ForEach<FileType[]>(query.ToArray(), t => result = result.Concat(t));

            return result.Distinct().ToArray();
        }

        public static FileType[] GetFileTypes(DocumentType type)
        {
            FileType[] result;
            if (_doc2allTypes.ContainsKey(type))
            {
                FileType[] source = _doc2allTypes[type];
                result = new FileType[source.Length];
                source.CopyTo(result, 0);
            }
            else
            {
                result = new FileType[0];
            }

            return result;
        }

        public static FileType[] GetNativeFileTypes(DocumentType type)
        {
            FileType[] result;
            if (_doc2fileTypes.ContainsKey(type))
            {
                FileType[] source = _doc2fileTypes[type];
                result = new FileType[source.Length];
                source.CopyTo(result, 0);
            }
            else
            {
                result = new FileType[0];
            }

            return result;
        }

        public static FileType[] GetCustomFileTypes(DocumentType type)
        {
            FileType[] result;
            if (_doc2fileTypes.ContainsKey(type))
            {
                FileType[] source = _doc2customTypes[type];
                result = new FileType[source.Length];
                source.CopyTo(result, 0);
            }
            else
            {
                result = new FileType[0];
            }

            return result;
        }

        public static DocumentType[] GetDocumentTypes(string fileExtension)
        {
            FileType fileType = GetFileType(fileExtension);
            return GetDocumentTypes(fileType);
        }

        public static DocumentType[] GetDocumentTypes(FileType fileType)
        {
            var types = _doc2fileTypes
                .Where(kvp => kvp.Value.Any(ft => ft == fileType))
                .Select(kvp => kvp.Key);
            return types.ToArray();
        }

        public static Dictionary<FileType, TOrigin> GetTypesMap<TOrigin>(DocumentType docType)
            where TOrigin : struct
        {
            Dictionary<FileType, TOrigin> result = new Dictionary<FileType, TOrigin>();
            FileTypeInfo[] typesInfo = _doc2typesInfo[docType];

			Array.ForEach<FileTypeInfo>(typesInfo, ti =>
                result[ti.Type] = (TOrigin) Enum.Parse(typeof(TOrigin), (string.IsNullOrEmpty(ti.Origin) ? ti.Type.ToString() : ti.Origin), true));
            return result;
        }

        public static bool IsKnownType(string fileExtension)
        {
            return (GetFileType(fileExtension) != FileType.Undefined);
        }

        public static FileType GetFileType(string fileExtension)
        {
            try
            {
                fileExtension = fileExtension.Trim('.', ' ', '\r', '\n');
                if (String.IsNullOrEmpty(fileExtension)) return FileType.Undefined;

                FileType type = (FileType) Enum.Parse(typeof(FileType), fileExtension, true);
                return type;
            }
            catch
            {
                return FileType.Undefined;
            }
        }

        private struct FileTypeInfo
        {
            public FileType Type;
            public string Origin;
        }
    }
}
