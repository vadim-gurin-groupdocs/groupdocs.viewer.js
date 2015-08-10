using System;

namespace Groupdocs.Engine.Documents.Savers
{
    using Groupdocs.Auxiliary;

    public class PagesRange : Range<int>
    {
        public PagesRange()
            : base()
        {
        }

        public PagesRange(int first, int last)
            : base(first, last)
        {
        }

        public PagesRange(int? first, int? last)
            : base(first, last)
        {
        }

        public int? PageCount
        {
            get
            {
                return (Max - (Min ?? 0) + 1);
            }
        }
    }
}
