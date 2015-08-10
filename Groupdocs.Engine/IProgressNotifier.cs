namespace Groupdocs.Engine
{
    public delegate void  ProgressDelegate(decimal currentProgress);
    public interface IProgressNotifier
    {
        event ProgressDelegate Progress;
    }
}
