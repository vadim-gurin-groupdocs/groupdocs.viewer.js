using System;

namespace Groupdocs.Auxiliary
{
    public class Range<T>
        where T : struct, IComparable<T>
    {
        public Range()
        {
        }

        public Range(T? min, T? max)
        {
            Min = min;
            Max = max;
        }

        public bool Contains(T value)
        {
            return ((Min == null || Min.Value.CompareTo(value) <= 0) &&
                (Max == null || Max.Value.CompareTo(value) >= 0));
        }

        public override string ToString()
        {
            return String.Format("[{0}, {1}]", Min, Max);
        }

        public T? Min { get; set; }
        public T? Max { get; set; }
    }
}
