namespace Groupdocs.Engine.Viewing.InstallableViewer
{
    public interface IThirdPartyViewingService: IHtmlViewingService
    {
        string[] GetPageImageUrlsOnThirdPartyStorage(string path, int pageCount, int? quality, int? width,
                                                            int? height, bool usePdf);
    }
}
