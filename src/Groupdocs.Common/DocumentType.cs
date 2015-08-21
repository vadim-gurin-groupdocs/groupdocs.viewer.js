using System;

namespace Groupdocs.Common
{
    public enum DocumentType
    {
        Undefined = -1,

        /// <summary>
        /// Represents Excel format
        /// </summary>
        Cells,

        /// <summary>
        /// Represents Word format
        /// </summary>
        Words,

        /// <summary>
        /// Represents Powerpoint format
        /// </summary>
        Slides,

        /// <summary>
        /// Represents Pdf format
        /// </summary>
        Pdf,
        Html,
        Image,
        Email,
        Diagram,
		Project,
        Autocad,
        TaggedImage,
        Svg
    }

    public struct DocumentTypeDetails
    {
        public Groupdocs.Common.DocumentType DocumentType;
        public Groupdocs.Common.FileType? FileType;
        public int? Version;
    }
}
